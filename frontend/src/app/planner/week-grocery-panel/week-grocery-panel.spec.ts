import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../core/toast.service';
import { groceryList } from '../../grocery-list/grocery-list.fixtures';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { WeekGroceryPanel } from './week-grocery-panel';

describe('WeekGroceryPanel', () => {
  const service = { getLists: vi.fn(), createList: vi.fn(), addPlannerWeek: vi.fn() };
  const toasts = { success: vi.fn(), error: vi.fn() };

  async function render(): Promise<{
    fixture: ComponentFixture<WeekGroceryPanel>;
    page: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [WeekGroceryPanel],
      providers: [
        provideRouter([]),
        { provide: GroceryListsService, useValue: service },
        { provide: ToastService, useValue: toasts },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WeekGroceryPanel);
    fixture.componentRef.setInput('from', '2026-09-21');
    fixture.componentRef.setInput('to', '2026-09-27');
    fixture.componentRef.setInput('weekTitle', 'September 21–27, 2026');
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  async function submit(fixture: ComponentFixture<WeekGroceryPanel>): Promise<void> {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();
  }

  beforeEach(() => vi.resetAllMocks());

  it('adds the week to the first list, allowing for the pantry, and summarizes the result', async () => {
    const list = groceryList([], { id: 'list-1', name: 'Weekly' });
    service.getLists.mockReturnValue(of([list]));
    service.addPlannerWeek.mockReturnValue(
      of({
        list,
        added: ['Rice', 'Eggs'],
        coveredByPantry: ['Milk'],
        skipped: [{ name: 'Garlic', reason: 'Garlic is needed in tbsp and piece.' }],
      }),
    );
    const { fixture, page } = await render();

    await submit(fixture);

    expect(service.addPlannerWeek).toHaveBeenCalledWith('list-1', '2026-09-21', '2026-09-27', true);
    expect(toasts.success).toHaveBeenCalledWith('2 items added to Weekly');
    expect(page.querySelector('.summary-title')?.textContent).toContain('2 items added to Weekly.');
    expect(page.querySelector('.covered')?.textContent).toContain('Milk');
    expect(page.querySelector('.skipped')?.textContent).toContain('Garlic is needed');
  });

  it('creates a new list named for the week when the user has none', async () => {
    const created = groceryList([], { id: 'new-1', name: 'Groceries for September 21–27, 2026' });
    service.getLists.mockReturnValue(of([]));
    service.createList.mockReturnValue(of(created));
    service.addPlannerWeek.mockReturnValue(
      of({ list: created, added: ['Rice'], coveredByPantry: [], skipped: [] }),
    );
    const { fixture, page } = await render();

    (page.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    await submit(fixture);

    expect(service.createList).toHaveBeenCalledWith('Groceries for September 21–27, 2026');
    expect(service.addPlannerWeek).toHaveBeenCalledWith('new-1', '2026-09-21', '2026-09-27', false);
  });

  it('shows the backend’s message when nothing can be added', async () => {
    service.getLists.mockReturnValue(of([groceryList([], { id: 'list-1' })]));
    service.addPlannerWeek.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'No meals are planned for those days.' },
          }),
      ),
    );
    const { fixture, page } = await render();

    await submit(fixture);

    expect(page.querySelector('.ui-error')?.textContent).toBe(
      'No meals are planned for those days.',
    );
  });
});
