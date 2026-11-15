import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { NotificationStatus, UserNotification } from '../notification.models';
import { NotificationsService } from '../notifications.service';

/** How many of the newest notifications the panel lists. */
const MAX_SHOWN = 5;

/**
 * "Notifications (n)" panel for the home page. A shared grocery list shows Accept and Reject
 * buttons; accepting creates a new list in the user's account.
 */
@Component({
  selector: 'app-notifications-panel',
  imports: [RouterLink],
  templateUrl: './notifications-panel.html',
  styleUrl: './notifications-panel.css',
})
export class NotificationsPanel implements OnInit {
  /** All of the user's notifications, newest first. */
  protected readonly notifications = signal<UserNotification[]>([]);
  /** True if the notifications could not be loaded. */
  protected readonly loadError = signal(false);
  /** The last error from accepting or rejecting, or null. */
  protected readonly actionError = signal<string | null>(null);
  /** Id of the notification being answered, so its buttons can't be pressed twice. */
  protected readonly busyId = signal<string | null>(null);
  /** For notifications accepted this visit: the id of the list that was created. */
  protected readonly acceptedLists = signal<Record<string, string>>({});

  /** The notifications the panel lists. */
  protected readonly shown = computed(() => this.notifications().slice(0, MAX_SHOWN));
  /** The number in the heading: notifications not yet answered. */
  protected readonly unreadCount = computed(
    () => this.notifications().filter((item) => !item.read).length,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
  ) {}

  /** Loads the notifications when the panel appears. */
  public ngOnInit(): void {
    this.notificationsService.getNotifications().subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: () => this.loadError.set(true),
    });
  }

  /** "Accept": the backend creates a new list from the shared one. */
  protected accept(item: UserNotification): void {
    this.busyId.set(item.id);
    this.groceryLists.acceptShare(item.id).subscribe({
      next: (list) => {
        this.acceptedLists.update((lists) => ({ ...lists, [item.id]: list.id }));
        this.answered(item, 'accepted');
        this.toasts.success(`Added “${list.name}” to your grocery lists`);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  /** "Reject": nothing is added to the user's account. */
  protected reject(item: UserNotification): void {
    this.busyId.set(item.id);
    this.groceryLists.rejectShare(item.id).subscribe({
      next: () => this.answered(item, 'rejected'),
      error: (error: unknown) => this.fail(error),
    });
  }

  /** Shows the notification as answered (and read) without reloading. */
  private answered(item: UserNotification, status: NotificationStatus): void {
    this.notifications.update((all) =>
      all.map((existing) =>
        existing.id === item.id ? { ...existing, status, read: true } : existing,
      ),
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
