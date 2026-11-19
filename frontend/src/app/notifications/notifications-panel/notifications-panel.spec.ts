import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../core/session.service';
import { groceryList } from '../../grocery-list/grocery-list.fixtures';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import {
  listInviteNotification,
  notification,
  recipeRevokedNotification,
  recipeShareNotification,
} from '../notification.fixtures';
import { UserNotification } from '../notification.models';
import { NotificationsService } from '../notifications.service';
import { NotificationsPanel } from './notifications-panel';

describe('NotificationsPanel', () => {
  const notifications = { getNotifications: vi.fn(), markRead: vi.fn() };
  const groceryLists = { acceptShare: vi.fn(), rejectShare: vi.fn(), removeMember: vi.fn() };
  const session = { userId: signal<string | null>('bob') };

  async function render(): Promise<{
    fixture: ComponentFixture<NotificationsPanel>;
    panel: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [NotificationsPanel],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: NotificationsService, useValue: notifications },
        { provide: GroceryListsService, useValue: groceryLists },
        { provide: SessionService, useValue: session },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationsPanel);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, panel: fixture.nativeElement as HTMLElement };
  }

  /** Clicks the button or link whose text is `label`. */
  const press = (panel: HTMLElement, label: string): void => {
    const target = [...panel.querySelectorAll<HTMLElement>('.actions .ui-button')].find(
      (element) => element.textContent?.trim() === label,
    );
    if (!target) {
      throw new Error(`No "${label}" button`);
    }
    target.click();
  };
  /** The labels of the first notification's buttons, in order. */
  const labels = (panel: HTMLElement): string[] =>
    [...panel.querySelectorAll('.item:first-child .actions .ui-button')].map(
      (element) => element.textContent?.trim() ?? '',
    );
  const heading = (panel: HTMLElement) => panel.querySelector('h2')?.textContent ?? '';
  const failure = (message: string) =>
    throwError(() => new HttpErrorResponse({ status: 409, error: { message } }));

  beforeEach(() => vi.resetAllMocks());

  it('lists only notifications not yet handled, and counts them', async () => {
    notifications.getNotifications.mockReturnValue(
      of([
        notification(),
        notification({ id: 'n2', status: 'accepted', read: true }),
        recipeShareNotification({ read: true }),
      ]),
    );

    const { panel } = await render();

    expect(heading(panel)).toContain('Notifications (1)');
    expect(panel.querySelectorAll('.item')).toHaveLength(1);
  });

  it.each<[string, UserNotification, string, string[]]>([
    [
      'live list invite',
      listInviteNotification(),
      'added you to the live grocery list “Household”',
      ['Open list', 'Leave list', 'Dismiss'],
    ],
    [
      'list copy',
      notification(),
      'sent you a copy of the grocery list “Weekly” (1 item)',
      ['Accept', 'Reject'],
    ],
    [
      'recipe share',
      recipeShareNotification(),
      'shared the recipe “Garlic Pasta” with you',
      ['View recipe', 'Dismiss'],
    ],
    [
      'revoked recipe',
      recipeRevokedNotification(),
      'stopped sharing the recipe “Garlic Pasta” with you',
      ['Dismiss'],
    ],
  ])('shows a %s as who and what, then its buttons', async (_, item, message, buttons) => {
    notifications.getNotifications.mockReturnValue(of([item]));

    const { panel } = await render();

    expect(panel.querySelector('.message strong')?.textContent).toBe('Peter');
    expect(panel.querySelector('.message')?.textContent).toContain(message);
    expect(labels(panel)).toEqual(buttons);
  });

  it('Accept creates the list and shows the outcome with a link to it', async () => {
    notifications.getNotifications.mockReturnValue(of([notification()]));
    groceryLists.acceptShare.mockReturnValue(of(groceryList([], { id: 'list-9', name: 'Weekly' })));
    const { fixture, panel } = await render();

    press(panel, 'Accept');
    fixture.detectChanges();

    expect(groceryLists.acceptShare).toHaveBeenCalledWith('n1');
    expect(panel.querySelector('.actions')).toBeNull();
    expect(panel.querySelector('.outcome')?.textContent).toContain('Added to your grocery lists');
    expect(panel.querySelector('.outcome a')?.getAttribute('href')).toContain('list=list-9');
    expect(heading(panel)).toContain('Notifications (0)');
  });

  it('Reject shows the outcome without creating a list', async () => {
    notifications.getNotifications.mockReturnValue(of([notification()]));
    groceryLists.rejectShare.mockReturnValue(of(undefined));
    const { fixture, panel } = await render();

    press(panel, 'Reject');
    fixture.detectChanges();

    expect(groceryLists.rejectShare).toHaveBeenCalledWith('n1');
    expect(groceryLists.acceptShare).not.toHaveBeenCalled();
    expect(panel.querySelector('.outcome')?.textContent).toContain('Rejected');
  });

  it('Leave list removes the user from the list and shows the outcome', async () => {
    notifications.getNotifications.mockReturnValue(of([listInviteNotification()]));
    groceryLists.removeMember.mockReturnValue(of(groceryList([], { id: 'list-7' })));
    const { fixture, panel } = await render();

    press(panel, 'Leave list');
    fixture.detectChanges();

    expect(groceryLists.removeMember).toHaveBeenCalledWith('list-7', 'bob');
    expect(panel.querySelector('.outcome')?.textContent).toContain('You left this list');
    expect(heading(panel)).toContain('Notifications (0)');
  });

  it('Open list and View recipe link to the item and mark the notification handled', async () => {
    notifications.getNotifications.mockReturnValue(
      of([listInviteNotification(), recipeShareNotification()]),
    );
    notifications.markRead.mockReturnValue(of(listInviteNotification({ read: true })));
    const { fixture, panel } = await render();

    const links = panel.querySelectorAll<HTMLAnchorElement>('a.ui-button');
    expect(links[0].getAttribute('href')).toContain('list=list-7');
    expect(links[1].getAttribute('href')).toContain('/recipes/r1');

    links[0].click();
    await fixture.whenStable();

    expect(notifications.markRead).toHaveBeenCalledWith('n5');
  });

  it('Dismiss removes the notification from the panel at once', async () => {
    notifications.getNotifications.mockReturnValue(of([recipeRevokedNotification()]));
    notifications.markRead.mockReturnValue(of(recipeRevokedNotification({ read: true })));
    const { fixture, panel } = await render();

    press(panel, 'Dismiss');
    fixture.detectChanges();

    expect(notifications.markRead).toHaveBeenCalledWith('n4');
    expect(panel.querySelector('.item')).toBeNull();
    expect(panel.querySelector('.status')?.textContent).toContain("You're all caught up.");
  });

  it("shows the backend's message when an action fails, and keeps the buttons", async () => {
    notifications.getNotifications.mockReturnValue(of([notification(), listInviteNotification()]));
    groceryLists.acceptShare.mockReturnValue(failure('You have already answered this.'));
    groceryLists.removeMember.mockReturnValue(failure('Grocery list not found.'));
    const { fixture, panel } = await render();

    press(panel, 'Accept');
    fixture.detectChanges();
    expect(panel.querySelector('.error')?.textContent).toContain('already answered');

    press(panel, 'Leave list');
    fixture.detectChanges();
    expect(panel.querySelector('.error')?.textContent).toContain('Grocery list not found.');
    expect(panel.querySelectorAll('.actions')).toHaveLength(2);
  });

  it('lists the newest five and says how many more there are', async () => {
    notifications.getNotifications.mockReturnValue(
      of(Array.from({ length: 7 }, (_, index) => recipeRevokedNotification({ id: `n${index}` }))),
    );

    const { panel } = await render();

    expect(panel.querySelectorAll('.item')).toHaveLength(5);
    expect(panel.textContent).toContain('and 2 more');
    expect(heading(panel)).toContain('Notifications (7)');
  });

  it('says so when there are none', async () => {
    notifications.getNotifications.mockReturnValue(of([]));
    const { panel } = await render();
    expect(panel.querySelector('.status')?.textContent).toContain("You're all caught up.");
  });

  it('shows an error when the notifications cannot be loaded', async () => {
    notifications.getNotifications.mockReturnValue(throwError(() => new Error('offline')));
    const { panel } = await render();
    expect(panel.querySelector('.status')?.textContent).toContain("couldn't load");
  });
});
