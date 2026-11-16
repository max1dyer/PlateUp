import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { groceryList } from '../../grocery-list/grocery-list.fixtures';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import {
  notification,
  recipeRevokedNotification,
  recipeShareNotification,
} from '../notification.fixtures';
import { NotificationsService } from '../notifications.service';
import { NotificationsPanel } from './notifications-panel';

describe('NotificationsPanel', () => {
  const notifications = { getNotifications: vi.fn(), markRead: vi.fn() };
  const groceryLists = { acceptShare: vi.fn(), rejectShare: vi.fn() };

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
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationsPanel);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, panel: fixture.nativeElement as HTMLElement };
  }

  const click = (panel: HTMLElement, selector: string): void =>
    (panel.querySelector(selector) as HTMLButtonElement).click();

  beforeEach(() => vi.resetAllMocks());

  it('shows the count and who sent which list', async () => {
    notifications.getNotifications.mockReturnValue(
      of([notification(), notification({ id: 'n2', status: 'accepted', read: true })]),
    );

    const { panel } = await render();

    expect(panel.querySelector('h2')?.textContent).toContain('Notifications (1)');
    const message = panel.querySelector('.message')?.textContent ?? '';
    expect(message).toContain('Peter');
    expect(message).toContain('sent you a grocery list');
    expect(message).toContain('Weekly');
    expect(panel.querySelectorAll('.accept')).toHaveLength(1);
  });

  it('Accept creates the list, shows it as accepted, and links to it', async () => {
    notifications.getNotifications.mockReturnValue(of([notification()]));
    groceryLists.acceptShare.mockReturnValue(of(groceryList([], { id: 'list-9', name: 'Weekly' })));
    const { fixture, panel } = await render();

    click(panel, '.accept');
    fixture.detectChanges();

    expect(groceryLists.acceptShare).toHaveBeenCalledWith('n1');
    expect(panel.querySelector('.accept')).toBeNull();
    expect(panel.querySelector('.answer')?.textContent).toContain('Accepted');
    expect(panel.querySelector('.answer a')?.getAttribute('href')).toContain('list=list-9');
    expect(panel.querySelector('h2')?.textContent).toContain('Notifications (0)');
  });

  it('Reject marks it rejected without creating a list', async () => {
    notifications.getNotifications.mockReturnValue(of([notification()]));
    groceryLists.rejectShare.mockReturnValue(of(undefined));
    const { fixture, panel } = await render();

    click(panel, '.reject');
    fixture.detectChanges();

    expect(groceryLists.rejectShare).toHaveBeenCalledWith('n1');
    expect(groceryLists.acceptShare).not.toHaveBeenCalled();
    expect(panel.querySelector('.answer')?.textContent).toContain('Rejected');
  });

  it("shows the backend's message when answering fails", async () => {
    notifications.getNotifications.mockReturnValue(of([notification()]));
    groceryLists.acceptShare.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'You have already answered this notification.' },
          }),
      ),
    );
    const { fixture, panel } = await render();

    click(panel, '.accept');
    fixture.detectChanges();

    expect(panel.querySelector('.error')?.textContent).toContain('already answered');
    expect(panel.querySelector('.accept')).not.toBeNull();
  });

  it('says so when there are none, or when they cannot be loaded', async () => {
    notifications.getNotifications.mockReturnValue(of([]));
    const { panel } = await render();
    expect(panel.querySelector('.status')?.textContent).toContain('No notifications yet.');
  });

  it('shows an error when the notifications cannot be loaded', async () => {
    notifications.getNotifications.mockReturnValue(throwError(() => new Error('offline')));
    const { panel } = await render();
    expect(panel.querySelector('.status')?.textContent).toContain("couldn't load");
  });

  it('shows a shared recipe with a link, and no Accept or Reject', async () => {
    notifications.getNotifications.mockReturnValue(of([recipeShareNotification()]));
    notifications.markRead.mockReturnValue(of(recipeShareNotification({ read: true })));
    const { fixture, panel } = await render();

    expect(panel.querySelector('.message')?.textContent).toContain('shared a recipe with you');
    expect(panel.querySelector('.message')?.textContent).toContain('Garlic Pasta');
    expect(panel.querySelector('.accept')).toBeNull();
    const link = panel.querySelector('.answer a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/recipes/r1');
    expect(panel.querySelector('h2')?.textContent).toContain('Notifications (1)');

    link.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(notifications.markRead).toHaveBeenCalledWith('n3');
    expect(panel.querySelector('h2')?.textContent).toContain('Notifications (0)');
  });

  it('shows a revoked notice as plain text that can be dismissed', async () => {
    notifications.getNotifications.mockReturnValue(of([recipeRevokedNotification()]));
    notifications.markRead.mockReturnValue(of(recipeRevokedNotification({ read: true })));
    const { fixture, panel } = await render();

    expect(panel.querySelector('.message')?.textContent).toContain('stopped sharing');
    expect(panel.querySelector('.answer a')).toBeNull();

    click(panel, '.dismiss');
    fixture.detectChanges();

    expect(notifications.markRead).toHaveBeenCalledWith('n4');
    expect(panel.querySelector('.dismiss')).toBeNull();
    expect(panel.querySelector('h2')?.textContent).toContain('Notifications (0)');
  });
});
