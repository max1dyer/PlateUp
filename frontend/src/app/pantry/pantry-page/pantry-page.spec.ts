import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { pantryItem } from '../pantry.fixtures';
import { PantryPage } from './pantry-page';
import { PantryService } from '../pantry.service';

describe('PantryPage', () => {
  const service = { getItems: vi.fn(), addItem: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn() };

  async function render(): Promise<{ fixture: ComponentFixture<PantryPage>; page: HTMLElement }> {
    await TestBed.configureTestingModule({
      imports: [PantryPage],
      providers: [{ provide: PantryService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PantryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const text = (page: HTMLElement, selector: string): string[] =>
    [...page.querySelectorAll(selector)].map((element) => element.textContent?.trim() ?? '');

  function submitAdd(page: HTMLElement, name: string): void {
    const input = page.querySelector('.add input') as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    (page.querySelector('form.add') as HTMLFormElement).dispatchEvent(new Event('submit'));
  }

  beforeEach(() => vi.resetAllMocks());

  it('lists items alphabetically with their amounts', async () => {
    service.getItems.mockReturnValue(
      of([
        pantryItem({ id: 'b', name: 'Rice', quantity: { amount: 2, unit: 'kg' } }),
        pantryItem({ id: 'a', name: 'Eggs' }),
      ]),
    );

    const { page } = await render();

    expect(text(page, '.name')).toEqual(['Eggs', 'Rice']);
    expect(text(page, '.quantity')).toEqual(['12', '2 kg']);
    expect(text(page, 'h2')[0]).toBe('On hand (2)');
  });

  it('shows the empty state', async () => {
    service.getItems.mockReturnValue(of([]));

    const { page } = await render();

    expect(text(page, '.ui-status')[0]).toContain('Your pantry is empty.');
  });

  it('adds an item and shows it', async () => {
    service.getItems.mockReturnValue(of([]));
    service.addItem.mockReturnValue(of(pantryItem({ name: 'Milk' })));
    const { fixture, page } = await render();

    submitAdd(page, 'Milk');
    await fixture.whenStable();

    expect(service.addItem).toHaveBeenCalledWith({
      name: 'Milk',
      quantity: { amount: 1, unit: 'piece' },
    });
    expect(text(page, '.name')).toEqual(['Milk']);
  });

  it('replaces an existing item when the backend combined the amounts', async () => {
    service.getItems.mockReturnValue(of([pantryItem()]));
    service.addItem.mockReturnValue(of(pantryItem({ quantity: { amount: 13, unit: 'piece' } })));
    const { fixture, page } = await render();

    submitAdd(page, 'eggs');
    await fixture.whenStable();

    expect(text(page, '.quantity')).toEqual(['13']);
  });

  it("shows the backend's message and keeps the name when adding fails", async () => {
    service.getItems.mockReturnValue(of([]));
    service.addItem.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Flour is in cup.' } }),
      ),
    );
    const { fixture, page } = await render();

    submitAdd(page, 'Flour');
    await fixture.whenStable();

    expect(text(page, '.ui-error')).toEqual(['Flour is in cup.']);
    expect((page.querySelector('.add input') as HTMLInputElement).value).toBe('Flour');
  });

  it('removes an item', async () => {
    service.getItems.mockReturnValue(of([pantryItem()]));
    service.removeItem.mockReturnValue(of(undefined));
    const { fixture, page } = await render();

    (page.querySelector('.delete') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.removeItem).toHaveBeenCalledWith('item-1');
    expect(text(page, '.ui-status')[0]).toContain('Your pantry is empty.');
  });

  it('edits an item inline', async () => {
    service.getItems.mockReturnValue(of([pantryItem()]));
    service.updateItem.mockReturnValue(of(pantryItem({ quantity: { amount: 6, unit: 'piece' } })));
    const { fixture, page } = await render();

    (page.querySelector('.details') as HTMLButtonElement).click();
    fixture.detectChanges();
    const amount = page.querySelector('.edit input[type=number]') as HTMLInputElement;
    amount.value = '6';
    amount.dispatchEvent(new Event('input'));
    (page.querySelector('form.edit') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(service.updateItem).toHaveBeenCalledWith('item-1', {
      name: 'Eggs',
      quantity: { amount: 6, unit: 'piece' },
    });
    expect(text(page, '.quantity')).toEqual(['6']);
  });
});
