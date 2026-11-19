import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { GroceryListInviteNotification, UserNotification } from '../notification.models';
import { NotificationsService } from '../notifications.service';

/** How many notifications the panel lists at once. */
const MAX_SHOWN = 5;

/** What the user did with a notification this visit, shown in place of its buttons. */
interface Outcome {
  message: string;
  /** A list to link to ("View list"), if the action created or kept one. */
  listId?: string;
}

/**
 * "Notifications (n)" panel for the home page: an inbox of what still needs the user's attention.
 *
 * Every notification follows the same rule. The panel lists only unhandled (unread) ones. Acting
 * on one (Accept, Reject, Leave list) marks it handled and shows the outcome in place of its
 * buttons until the user leaves the page, so it is gone on the next visit. Opening a link (Open
 * list, View recipe) marks it handled too, and Dismiss removes it at once. Nothing is lost: lists
 * live on the grocery page and shared recipes on their own pages.
 */
@Component({
  selector: 'app-notifications-panel',
  imports: [RouterLink],
  templateUrl: './notifications-panel.html',
  styleUrl: './notifications-panel.css',
})
export class NotificationsPanel implements OnInit {
  /** Unhandled notifications from the last load, newest first, plus any handled this visit. */
  protected readonly notifications = signal<UserNotification[]>([]);
  /** True if the notifications could not be loaded. */
  protected readonly loadError = signal(false);
  /** The last error from acting on a notification, or null. */
  protected readonly actionError = signal<string | null>(null);
  /** Id of the notification being answered, so its buttons can't be pressed twice. */
  protected readonly busyId = signal<string | null>(null);
  /** Outcomes of notifications handled this visit, by id. */
  protected readonly outcomes = signal<Record<string, Outcome>>({});

  /** The notifications the panel lists. */
  protected readonly shown = computed(() => this.notifications().slice(0, MAX_SHOWN));
  /** How many more there are than the panel lists. */
  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.notifications().length - MAX_SHOWN),
  );
  /** The number in the heading: notifications still waiting for the user. */
  protected readonly unreadCount = computed(
    () => this.notifications().filter((item) => !item.read).length,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
    private readonly session: SessionService,
  ) {}

  /** Loads the notifications still waiting for the user. */
  public ngOnInit(): void {
    this.notificationsService.getNotifications().subscribe({
      next: (notifications) => this.notifications.set(notifications.filter((item) => !item.read)),
      error: () => this.loadError.set(true),
    });
  }

  /** "Accept" on a list copy: the backend creates a new list from it. */
  protected accept(item: UserNotification): void {
    this.busyId.set(item.id);
    this.groceryLists.acceptShare(item.id).subscribe({
      next: (list) => {
        this.handled(item, { message: 'Added to your grocery lists', listId: list.id });
        this.toasts.success(`Added “${list.name}” to your grocery lists`);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** "Reject" on a list copy: nothing is added to the user's account. */
  protected reject(item: UserNotification): void {
    this.busyId.set(item.id);
    this.groceryLists.rejectShare(item.id).subscribe({
      next: () => this.handled(item, { message: 'Rejected' }),
      error: (error: unknown) => this.fail(error),
    });
  }

  /** "Leave list" on a live list invite: removes the user from the list (and the invite). */
  protected leave(item: GroceryListInviteNotification): void {
    const userId = this.session.userId();
    if (userId === null) {
      return;
    }
    this.busyId.set(item.id);
    this.groceryLists.removeMember(item.payload.listId, userId).subscribe({
      next: () => this.handled(item, { message: 'You left this list' }),
      error: (error: unknown) => this.fail(error),
    });
  }

  /** "Open list" / "View recipe": the link navigates away; this records it as handled. */
  protected opened(item: UserNotification): void {
    this.notificationsService.markRead(item.id).subscribe({
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }

  /** "Dismiss": marks it handled and removes it from the panel at once. */
  protected dismiss(item: UserNotification): void {
    this.busyId.set(item.id);
    this.notificationsService.markRead(item.id).subscribe({
      next: () => {
        this.notifications.update((all) => all.filter((existing) => existing.id !== item.id));
        this.busyId.set(null);
        this.actionError.set(null);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Shows the outcome in place of the buttons, and stops counting it as waiting. */
  private handled(item: UserNotification, outcome: Outcome): void {
    this.outcomes.update((outcomes) => ({ ...outcomes, [item.id]: outcome }));
    this.notifications.update((all) =>
      all.map((existing) => (existing.id === item.id ? { ...existing, read: true } : existing)),
    );
    this.busyId.set(null);
    this.actionError.set(null);
  }

  /** Shows the backend's message and re-enables the buttons. */
  private fail(error: unknown): void {
    this.busyId.set(null);
    this.actionError.set(errorMessage(error));
  }
}
