import { TestBed } from '@angular/core/testing';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  async function render(rating: number | null): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [StarRating] }).compileComponents();
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('rating', rating);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const fills = (page: HTMLElement): string[] =>
    [...page.querySelectorAll<HTMLElement>('.fill')].map((fill) => fill.style.width);

  it('fills one star per point and labels the rating for screen readers', async () => {
    const page = await render(3);

    expect(fills(page)).toEqual(['100%', '100%', '100%', '0%', '0%']);
    expect(page.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('3 out of 5 stars');
  });

  it('fills part of a star for a fractional average', async () => {
    expect(fills(await render(4.3))).toEqual(['100%', '100%', '100%', '100%', '30%']);
  });

  it('shows empty stars before the first rating', async () => {
    const page = await render(null);

    expect(fills(page)).toEqual(['0%', '0%', '0%', '0%', '0%']);
    expect(page.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('No ratings yet');
  });
});
