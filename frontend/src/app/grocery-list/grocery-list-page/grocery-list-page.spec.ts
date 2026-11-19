import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { groceryItem, groceryList } from '../grocery-list.fixtures';
import { DEFAULT_LIST_NAME, GroceryListPage } from './grocery-list-page';
import { GroceryListsService } from '../grocery-lists.service';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { SessionService } from '../../core/session.service';

describe('GroceryListPage', () => {
  const service = {
    getLists: vi.fn(),
    createList: vi.fn(),
    renameList: vi.fn(),
    deleteList: vi.fn(),
    removePurchasedItems: vi.fn(),
    movePurchasedToPantry: vi.fn(),
    shareList: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    getList: vi.fn(),
  };

  async function render(url = '/grocery'): Promise<{
    fixture: ComponentFixture<GroceryListPage>;
    page: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [GroceryListPage],
      providers: [
        provideRouter([{ path: 'grocery', component: GroceryListPage }]),
        { provide: GroceryListsService, useValue: service },
        // Signed in as the fixtures' list owner.
        { provide: SessionService, useValue: { userId: signal('demo-user') } },
      ],
    }).compileComponents();
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(GroceryListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  beforeEach(() => vi.resetAllMocks());

  it('shows the first list grouped by category with counts', async () => {
    service.getLists.mockReturnValue(
      of([
        groceryList([
          groceryItem({
            id: 'a',
            name: 'Shredded Lettuce',
            quantity: { amount: 1, unit: 'bag' },
            category: 'produce',
          }),
          groceryItem({ id: 'b', name: 'Chicken breast', quantity: { amount: 3, unit: 'lb' } }),
          groceryItem({ id: 'c', name: 'Eggs', purchased: true }),
        ]),
      ]),
    );

    const { page } = await render();

    expect(text(page, '.heading')).toEqual(['Items (3)']);
    expect(text(page, '.summary-text')[0]).toContain('1 of 3 in cart');
    expect(text(page, '.group-label')).toEqual(['Protein', 'Produce']);
    expect(text(page, '.name')).toEqual(['Chicken breast', 'Eggs', 'Shredded Lettuce']);
    expect(text(page, '.quantity')).toEqual(['3 lb', '1 carton', '1 bag']);
    expect(page.querySelectorAll('.card.green')).toHaveLength(1);
    expect(service.createList).not.toHaveBeenCalled();
  });

  it('shows the estimated total of the list', async () => {
    service.getLists.mockReturnValue(
      of([groceryList([groceryItem({ estimatedCost: 4.2 })], { estimatedTotal: 4.2 })]),
    );

    const { page } = await render();

    expect(text(page, '.estimated-total')).toEqual(['Estimated total: about $4.20']);
  });

  it('creates a list when the user has none', async () => {
    service.getLists.mockReturnValue(of([]));
    service.createList.mockReturnValue(of(groceryList()));

    const { page } = await render();

    expect(service.createList).toHaveBeenCalledWith(DEFAULT_LIST_NAME);
    expect(text(page, '.status')[0]).toContain('Your list is empty.');
  });

  it('shows an error with a retry when the list cannot be loaded', async () => {
    service.getLists.mockReturnValue(throwError(() => new Error('offline')));

    const { page } = await render();

    expect(text(page, '.status')[0]).toContain("We couldn't load your grocery list.");
  });

  it('Remove Selected removes the items in the cart', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem({ purchased: true })])]));
    service.removePurchasedItems.mockReturnValue(of(groceryList()));
    const { fixture, page } = await render();

    (page.querySelector('.remove-selected') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.removePurchasedItems).toHaveBeenCalledWith('list-1');
    expect(text(page, '.heading')).toEqual(['Items (0)']);
  });

  it('+ Add items opens the add form', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    const { fixture, page } = await render();

    (page.querySelector('.action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(page.querySelector('app-add-items-form')).not.toBeNull();
    expect(page.querySelector('.action')).toBeNull();
  });

  it('opens the list named in the address', async () => {
    service.getLists.mockReturnValue(
      of([
        groceryList([], { id: 'list-1', name: 'Weekly' }),
        groceryList([], { id: 'list-2', name: 'Party' }),
      ]),
    );

    const { page } = await render('/grocery?list=list-2');

    expect((page.querySelector('.list-picker') as HTMLSelectElement).value).toBe('list-2');
  });

  it('+ New creates a list and switches to it', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    service.createList.mockReturnValue(of(groceryList([], { id: 'list-2', name: 'Party' })));
    const { fixture, page } = await render();

    [...page.querySelectorAll<HTMLButtonElement>('.manage')]
      .find((button) => button.textContent?.includes('New'))
      ?.click();
    fixture.detectChanges();
    const input = page.querySelector('.list-name') as HTMLInputElement;
    input.value = 'Party';
    input.dispatchEvent(new Event('input'));
    (page.querySelector('.list-name-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(service.createList).toHaveBeenCalledWith('Party');
    expect((page.querySelector('.list-picker') as HTMLSelectElement).value).toBe('list-2');
  });

  it('Move to Pantry moves the checked items and explains any it skipped', async () => {
    const chips = groceryItem({ id: 'item-2', name: 'Chips', quantity: null, purchased: true });
    service.getLists.mockReturnValue(of([groceryList([groceryItem({ purchased: true }), chips])]));
    service.movePurchasedToPantry.mockReturnValue(
      of({
        list: groceryList([chips]),
        moved: ['Eggs'],
        skipped: [
          { name: 'Chips', reason: 'Give Chips an amount before moving it to your pantry.' },
        ],
      }),
    );
    const { fixture, page } = await render();

    (page.querySelector('.move-to-pantry') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.movePurchasedToPantry).toHaveBeenCalledWith('list-1');
    expect(text(page, '.heading')).toEqual(['Items (1)']);
    expect(text(page, '.error')[0]).toContain('Give Chips an amount');
  });

  it('hides the bulk actions until something is checked', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem()])]));
    const { page } = await render();

    expect(page.querySelector('.move-to-pantry')).toBeNull();
    expect(page.querySelector('.remove-selected')).toBeNull();
  });

  it('Send to user sends the list to the typed username', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem()])]));
    service.shareList.mockReturnValue(of(undefined));
    const { fixture, page } = await render();

    (page.querySelector('.send-copy') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = page.querySelector('.share-name') as HTMLInputElement;
    input.value = 'bob';
    input.dispatchEvent(new Event('input'));
    (page.querySelector('.share-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.shareList).toHaveBeenCalledWith('list-1', 'bob');
    expect(page.querySelector('.share-form')).toBeNull();
  });

  it('Send to user shows the backend error and keeps the form open', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem()])]));
    service.shareList.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'No account with the username "zed".' },
          }),
      ),
    );
    const { fixture, page } = await render();

    (page.querySelector('.send-copy') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = page.querySelector('.share-name') as HTMLInputElement;
    input.value = 'zed';
    input.dispatchEvent(new Event('input'));
    (page.querySelector('.share-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(page, '.error')[0]).toContain('No account with the username');
    expect(page.querySelector('.share-form')).not.toBeNull();
  });

  it('Copy as text puts the list on the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    service.getLists.mockReturnValue(
      of([
        groceryList([groceryItem({ name: 'Eggs', quantity: { amount: 2, unit: 'carton' } })], {
          name: 'Weekly',
        }),
      ]),
    );
    const { page } = await render();

    const copy = [...page.querySelectorAll<HTMLButtonElement>('.export .manage')].find((button) =>
      button.textContent?.includes('Copy'),
    );
    copy?.click();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('Weekly');
    expect(writeText.mock.calls[0][0]).toContain('- 2 cartons Eggs');
  });

  it('Download .txt saves a file named after the list', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    service.getLists.mockReturnValue(of([groceryList([groceryItem()], { name: 'Weekly' })]));
    const { page } = await render();

    const download = [...page.querySelectorAll<HTMLButtonElement>('.export .manage')].find(
      (button) => button.textContent?.includes('Download'),
    );
    download?.click();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('export buttons are disabled for an empty list', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    const { page } = await render();

    const buttons = [...page.querySelectorAll<HTMLButtonElement>('.export .manage')];
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });

  it('Share adds the typed username as a member of the list', async () => {
    const shared = groceryList([], { members: [{ id: 'bob-id', name: 'Bob' }] });
    service.getLists.mockReturnValue(of([groceryList()]));
    service.addMember.mockReturnValue(of(shared));
    const { fixture, page } = await render();

    (page.querySelector('.share-list') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = page.querySelector('.collab-form input') as HTMLInputElement;
    input.value = 'bob';
    input.dispatchEvent(new Event('input'));
    (page.querySelector('.collab-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(service.addMember).toHaveBeenCalledWith('list-1', 'bob');
    expect(text(page, '.member')[0]).toContain('Bob');
  });

  it('tags items another member added to a shared list', async () => {
    service.getLists.mockReturnValue(
      of([
        groceryList(
          [
            groceryItem({ id: 'a', name: 'Milk', addedBy: { id: 'bob-id', name: 'Bob' } }),
            groceryItem({ id: 'b', name: 'Eggs', addedBy: { id: 'demo-user', name: 'Me' } }),
          ],
          { members: [{ id: 'bob-id', name: 'Bob' }] },
        ),
      ]),
    );
    const { page } = await render();

    expect(text(page, '.added-by')).toEqual(['Bob']);
  });

  it('a member sees Leave instead of Delete', async () => {
    service.getLists.mockReturnValue(of([groceryList([], { ownerId: 'alice-id' })]));
    const { page } = await render();

    expect(text(page, '.collab')[0]).toContain('Shared with you');
    expect(page.querySelector('.delete-list')).toBeNull();
    expect(page.querySelector('[aria-label="Delete list"]')).toBeNull();
    expect(text(page, '.collab .leave')).toEqual(['Leave']);
  });

  it('picks up another member’s change to a shared list and notes it', async () => {
    const before = groceryList([], { members: [{ id: 'bob-id', name: 'Bob' }] });
    const after = groceryList([groceryItem({ id: 'm', name: 'Milk' })], {
      members: before.members,
      updatedAt: '2026-10-28T00:00:00.000Z',
      activity: [
        { by: { id: 'bob-id', name: 'Bob' }, message: 'added Milk', at: '2026-10-28T00:00:00Z' },
      ],
    });
    service.getLists.mockReturnValue(of([before]));
    service.getList.mockReturnValue(of(after));
    const { fixture, page } = await render();

    fixture.componentInstance['pollSharedList']();
    fixture.detectChanges();

    expect(service.getList).toHaveBeenCalledWith('list-1');
    expect(text(page, '.name')).toEqual(['Milk']);
    expect(text(page, '.live-update')[0]).toContain('Bob added Milk');
  });

  it('does not poll a list that is not shared', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    const { fixture } = await render();

    fixture.componentInstance['pollSharedList']();

    expect(service.getList).not.toHaveBeenCalled();
  });

  it('+ New hides the current list and shows the name field in the picker’s place', async () => {
    service.getLists.mockReturnValue(of([groceryList([groceryItem({ name: 'Eggs' })])]));
    const { fixture, page } = await render();

    (page.querySelector('.new-list') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(page.querySelector('.list-picker')).toBeNull();
    expect(page.querySelector('.list-name')).not.toBeNull();
    expect(text(page, '.name')).toEqual([]);
  });

  it('the rename icon edits the list name in place', async () => {
    service.getLists.mockReturnValue(of([groceryList()]));
    service.renameList.mockReturnValue(of(groceryList([], { name: 'Weekly' })));
    const { fixture, page } = await render();

    (page.querySelector('[aria-label="Rename list"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = page.querySelector('.list-name') as HTMLInputElement;
    expect(input.value).toBe('Grocery list');
    input.value = 'Weekly';
    input.dispatchEvent(new Event('input'));
    (page.querySelector('.list-name-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(service.renameList).toHaveBeenCalledWith('list-1', 'Weekly');
    expect(page.querySelector('.list-picker')).not.toBeNull();
  });

  it('the delete icon asks first, then deletes the list', async () => {
    service.getLists.mockReturnValue(of([groceryList(), groceryList([], { id: 'list-2' })]));
    service.deleteList.mockReturnValue(of(undefined));
    const { fixture, page } = await render();

    (page.querySelector('[aria-label="Delete list"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(text(page, '.confirm-text')[0]).toContain('Delete “Grocery list”?');
    (page.querySelector('.delete-list .danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.deleteList).toHaveBeenCalledWith('list-1');
  });
});
