import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, interval } from 'rxjs';
import { errorMessage } from '../../core/api';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { AddItemsForm } from '../add-items-form/add-items-form';
import { GroceryItemRow } from '../grocery-item-row/grocery-item-row';
import { groupByCategory, formatListAsText } from '../grocery-list-format';
import { GroceryList, GroceryListItem } from '../grocery-list.models';

/** How many recent changes "Recent changes" shows. */
export const ACTIVITY_SHOWN = 10;
/** How often a shared list is checked for other people's changes, in milliseconds. */
export const LIVE_POLL_MS = 10_000;
/** How long the "Bob added Milk" note stays up, in milliseconds. */
export const LIVE_NOTE_MS = 8_000;
import { GroceryListsService } from '../grocery-lists.service';

/** Name given to the list created for a user who has none yet. */
export const DEFAULT_LIST_NAME = 'Grocery list';

/** What the list header is doing: just showing the picker, naming a new list, or renaming. */
type ListMode = 'view' | 'create' | 'rename';

/**
 * "Your Grocery List" page (UC12). Shows one of the user's lists (the one in
 * `?list=`, else the first, creating one if they have none) grouped by
 * category, with a picker to switch, create, rename, or delete lists.
 */
@Component({
  selector: 'app-grocery-list-page',
  imports: [AddItemsForm, GroceryItemRow, ReactiveFormsModule],
  templateUrl: './grocery-list-page.html',
  styleUrl: './grocery-list-page.css',
})
export class GroceryListPage implements OnInit {
  /** All of the user's lists, in the order the backend returned them. */
  protected readonly lists = signal<GroceryList[]>([]);
  /** Id of the list being shown. */
  protected readonly selectedId = signal<string | null>(null);
  /** True until the lists have loaded. */
  protected readonly loading = signal(true);
  /** True if the lists could not be loaded (the page offers a retry). */
  protected readonly loadError = signal(false);
  /** The last error from an action (rename, delete, move, ...), or null. */
  protected readonly actionError = signal<string | null>(null);
  /** True while the "+ Add items" form is open. */
  protected readonly adding = signal(false);
  protected readonly listMode = signal<ListMode>('view');
  /** The list-name field shown while creating or renaming, focused as soon as it appears. */
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  /** True while the "Delete this list?" confirmation is showing. */
  protected readonly confirmingDelete = signal(false);
  /** True while the "Send to user" username field is open. */
  protected readonly sharing = signal(false);
  /** The username field used when sending a copy of the list to another user. */
  protected readonly shareForm = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
  });
  /** The latest change someone else made to the shown shared list, e.g. "Bob added Milk". */
  protected readonly liveUpdate = signal<string | null>(null);
  /** How often shared lists refresh, shown next to "Live". */
  protected readonly liveSeconds = LIVE_POLL_MS / 1000;
  private liveNoteTimer: ReturnType<typeof setTimeout> | undefined;
  /** True while the "Share with" username field is open. */
  protected readonly addingMember = signal(false);
  /** The username field for sharing the list with another user. */
  protected readonly memberForm = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
  });
  /** The name field used when creating or renaming a list. */
  protected readonly listForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
  });

  /** The list being shown, or null before any have loaded. */
  protected readonly list = computed(
    () => this.lists().find((list) => list.id === this.selectedId()) ?? null,
  );
  /** True if the signed-in user owns the shown list (only the owner can share or delete it). */
  protected readonly isOwner = computed(() => this.list()?.ownerId === this.session.userId());
  /** True if the shown list is shared: the owner added members, or someone shared it with us. */
  protected readonly isShared = computed(() => {
    const list = this.list();
    return !!list && (list.members.length > 0 || !this.isOwner());
  });
  protected readonly activity = computed(
    () => this.list()?.activity.slice(0, ACTIVITY_SHOWN) ?? [],
  );
  /** True where the browser can open the system share sheet (iPhone, Android, Safari). */
  protected readonly canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  /** The shown list's items grouped by store section, for display. */
  protected readonly groups = computed(() => groupByCategory(this.list()?.items ?? []));
  /** Totals for the summary line ("3 of 8 items in cart"). */
  protected readonly itemCount = computed(() => this.list()?.items.length ?? 0);
  protected readonly inCartCount = computed(
    () => this.list()?.items.filter((item) => item.purchased).length ?? 0,
  );
  /** The shown list as plain text, or null before any list has loaded. */
  private readonly listText = computed(() => {
    const list = this.list();
    return list ? formatListAsText(list.name, list.items) : null;
  });

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly session: SessionService,
    private readonly toasts: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
    private readonly injector: Injector,
  ) {}

  /** Loads the user's lists when the page opens. */
  public ngOnInit(): void {
    this.load();
    // "Live" shared lists: poll the shown list while it is shared (a simple stand-in for push).
    interval(LIVE_POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollSharedList());
    this.destroyRef.onDestroy(() => clearTimeout(this.liveNoteTimer));
  }

  /**
   * Fetches the user's lists and selects the one in the address (or the first). A user with no
   * lists gets one created for them.
   */
  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.groceryLists.getLists().subscribe({
      next: (lists) => {
        if (lists.length === 0) {
          this.createFirstList();
          return;
        }
        const wanted = this.route.snapshot.queryParamMap.get('list');
        this.lists.set(lists);
        this.select(lists.some((list) => list.id === wanted) ? wanted : lists[0].id);
        this.loading.set(false);
      },
      error: () => this.failLoading(),
    });
  }

  /** "👥 " in front of shared lists in the picker. */
  protected pickerLabel(list: GroceryList): string {
    const shared = list.members.length > 0 || list.ownerId !== this.session.userId();
    return shared ? `👥 ${list.name}` : list.name;
  }

  /** True if someone other than the signed-in user made this change. */
  protected isOther(userId: string): boolean {
    return userId !== this.session.userId();
  }

  /** On a shared list, the name of whoever else added `item`; null for the user's own items. */
  protected addedByName(item: GroceryListItem): string | null {
    return this.isShared() && item.addedBy && this.isOther(item.addedBy.id)
      ? item.addedBy.name
      : null;
  }

  /** "just now", "5m ago", "3h ago", or "2d ago". */
  protected ago(at: string): string {
    const minutes = Math.floor((Date.now() - new Date(at).getTime()) / 60_000);
    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
  }

  /** Opens an empty username field for "Share with". */
  protected startAddingMember(): void {
    this.memberForm.setValue({ username: '' });
    this.sharing.set(false);
    this.addingMember.set(true);
  }

  /** Shares the shown list with the typed username, so they can see and edit it. */
  protected addMember(): void {
    const list = this.list();
    const username = this.memberForm.getRawValue().username.trim();
    if (!list) {
      return;
    }
    if (username.length === 0) {
      this.actionError.set('Enter the username to share the list with.');
      return;
    }
    this.groceryLists.addMember(list.id, username).subscribe({
      next: (updated) => {
        this.onListChanged(updated);
        this.addingMember.set(false);
        this.toasts.success(`Shared “${list.name}” with ${username}`);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** The owner stops sharing with a member. */
  protected removeMember(memberId: string): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.removeMember(list.id, memberId).subscribe({
      next: (updated) => this.onListChanged(updated),
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** A member leaves a list someone shared with them; it disappears from their lists. */
  protected leaveList(): void {
    const list = this.list();
    const userId = this.session.userId();
    if (!list || !userId) {
      return;
    }
    this.groceryLists.removeMember(list.id, userId).subscribe({
      next: () => {
        this.toasts.success(`Left ${list.name}`);
        this.dropList(list.id);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** Switches to the list picked in the dropdown. */
  protected onSelect(event: Event): void {
    this.select((event.target as HTMLSelectElement).value);
  }

  /** Replaces a list with the updated copy a child component or request returned. */
  protected onListChanged(list: GroceryList): void {
    this.lists.update((lists) =>
      lists.map((existing) => (existing.id === list.id ? list : existing)),
    );
    this.actionError.set(null);
  }

  /** "Remove Checked Items": deletes every purchased item and says how many went. */
  protected removeSelected(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.removePurchasedItems(list.id).subscribe({
      next: (updated) => {
        this.onListChanged(updated);
        this.toasts.success(`Removed ${list.items.length - updated.items.length} checked items`);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** Moves the checked items into the pantry; items it can't take stay checked on the list. */
  protected moveSelectedToPantry(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.movePurchasedToPantry(list.id).subscribe({
      next: ({ list: updated, moved, skipped }) => {
        this.onListChanged(updated);
        if (moved.length > 0) {
          this.toasts.success(
            `Moved ${moved.length} ${moved.length === 1 ? 'item' : 'items'} to your pantry`,
          );
        }
        // Explain each item the pantry refused (e.g. one with no amount).
        if (skipped.length > 0) {
          this.actionError.set(skipped.map((item) => item.reason).join(' '));
        }
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** Opens an empty username field for "Send to user". */
  protected startSharing(): void {
    this.shareForm.setValue({ username: '' });
    this.addingMember.set(false);
    this.sharing.set(true);
  }

  /** Sends a copy of the shown list to the typed username; they can accept or reject it. */
  protected sendList(): void {
    const list = this.list();
    const username = this.shareForm.getRawValue().username.trim();
    if (!list) {
      return;
    }
    if (username.length === 0) {
      this.actionError.set('Enter the username to send the list to.');
      return;
    }
    this.groceryLists.shareList(list.id, username).subscribe({
      next: () => {
        this.sharing.set(false);
        this.actionError.set(null);
        this.toasts.success(`Sent “${list.name}” to ${username}`);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** "Copy": puts the list on the clipboard as plain text. */
  protected async copyAsText(): Promise<void> {
    const text = this.listText();
    if (text === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.actionError.set(null);
      this.toasts.success('Grocery list copied');
    } catch {
      this.actionError.set("Couldn't copy the list. Try Download instead.");
    }
  }

  /** "Download": saves the list as a .txt file. */
  protected downloadAsText(): void {
    const text = this.listText();
    const list = this.list();
    if (text === null || !list) {
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${list.name.replace(/[^\w\- ]+/g, '').trim() || 'grocery-list'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** "Share": opens the share sheet so the list can go to Notes, Messages, etc. */
  protected async shareAsText(): Promise<void> {
    const text = this.listText();
    const list = this.list();
    if (text === null || !list) {
      return;
    }
    try {
      await navigator.share({ title: list.name, text });
    } catch (error) {
      // Closing the sheet without choosing anything is not an error.
      if ((error as DOMException).name !== 'AbortError') {
        this.actionError.set("Couldn't open the share sheet. Try Copy instead.");
      }
    }
  }

  /** Shows an empty name field for a new list. */
  protected startCreating(): void {
    this.listForm.setValue({ name: '' });
    this.listMode.set('create');
    this.closeForms();
    this.focusNameInput();
  }

  /** Leaves the name field (Cancel or Escape) and goes back to the shown list. */
  protected cancelNaming(): void {
    this.listMode.set('view');
    this.actionError.set(null);
  }

  /** Shows the name field filled with the current list's name. */
  protected startRenaming(): void {
    this.listForm.setValue({ name: this.list()?.name ?? '' });
    this.listMode.set('rename');
    this.focusNameInput();
  }

  /** Focuses (and selects) the list-name field once it has rendered. */
  private focusNameInput(): void {
    afterNextRender(
      () => {
        const input = this.nameInput()?.nativeElement;
        input?.focus();
        input?.select();
      },
      { injector: this.injector },
    );
  }

  /** Closes the add, share, and delete forms. */
  private closeForms(): void {
    this.adding.set(false);
    this.confirmingDelete.set(false);
    this.sharing.set(false);
    this.addingMember.set(false);
    this.actionError.set(null);
  }

  /** Creates a new list or renames the current one, depending on `listMode`. */
  protected saveListName(): void {
    const { name } = this.listForm.getRawValue();
    const list = this.list();
    if (name.trim().length === 0) {
      this.actionError.set('Enter a list name.');
      return;
    }
    const creating = this.listMode() === 'create';
    const request: Observable<GroceryList> =
      creating || !list
        ? this.groceryLists.createList(name)
        : this.groceryLists.renameList(list.id, name);
    request.subscribe({
      next: (saved) => {
        if (creating) {
          this.lists.update((lists) => [...lists, saved]);
          this.select(saved.id);
        } else {
          this.onListChanged(saved);
        }
        this.listMode.set('view');
        this.actionError.set(null);
        this.toasts.success(creating ? `Created ${saved.name}` : 'List renamed');
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /**
   * Deletes the shown list and selects another. Deleting the last list creates a fresh empty one,
   * so the page always has a list to show.
   */
  protected deleteList(): void {
    const list = this.list();
    if (!list) {
      return;
    }
    this.groceryLists.deleteList(list.id).subscribe({
      next: () => {
        this.confirmingDelete.set(false);
        this.toasts.success(`Deleted ${list.name}`);
        this.dropList(list.id);
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /**
   * Fetches the shown list if it is shared and, when it changed, swaps in the new copy and briefly
   * notes the newest change someone else made. Errors (e.g. access removed) are ignored.
   */
  private pollSharedList(): void {
    const list = this.list();
    if (!list || !this.isShared()) {
      return;
    }
    this.groceryLists.getList(list.id).subscribe({
      next: (latest) => {
        if (
          latest.updatedAt === list.updatedAt &&
          latest.activity.length === list.activity.length
        ) {
          return;
        }
        const seenUntil = list.activity[0]?.at ?? '';
        const fresh = latest.activity.filter(
          (entry) => entry.at > seenUntil && this.isOther(entry.by.id),
        );
        this.lists.update((lists) =>
          lists.map((existing) => (existing.id === latest.id ? latest : existing)),
        );
        if (fresh.length > 0) {
          const more = fresh.length > 1 ? ` (+${fresh.length - 1} more)` : '';
          this.showLiveUpdate(`${fresh[0].by.name} ${fresh[0].message}${more}`);
        }
      },
      error: () => undefined,
    });
  }

  /** Shows the live-update note for a few seconds. */
  private showLiveUpdate(message: string): void {
    clearTimeout(this.liveNoteTimer);
    this.liveUpdate.set(message);
    this.liveNoteTimer = setTimeout(() => this.liveUpdate.set(null), LIVE_NOTE_MS);
  }

  /** Removes a list from the page and selects another (creating one if none are left). */
  private dropList(listId: string): void {
    const remaining = this.lists().filter((other) => other.id !== listId);
    if (remaining.length === 0) {
      this.createFirstList();
      return;
    }
    this.lists.set(remaining);
    this.select(remaining[0].id);
  }

  /** Shows the given list, closing any open forms and clearing errors. */
  private select(listId: string | null): void {
    this.selectedId.set(listId);
    this.adding.set(false);
    this.confirmingDelete.set(false);
    this.actionError.set(null);
    this.sharing.set(false);
    this.addingMember.set(false);
    this.liveUpdate.set(null);
    // Keep the address in step so the page can be bookmarked or refreshed.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { list: listId },
      replaceUrl: true,
    });
  }

  /** Creates the default list for a user who has none, and shows it. */
  private createFirstList(): void {
    this.loading.set(true);
    this.groceryLists.createList(DEFAULT_LIST_NAME).subscribe({
      next: (list) => {
        this.lists.set([list]);
        this.select(list.id);
        this.loading.set(false);
      },
      error: () => this.failLoading(),
    });
  }

  /** Switches the page to its "could not load" state. */
  private failLoading(): void {
    this.loadError.set(true);
    this.loading.set(false);
  }
}
