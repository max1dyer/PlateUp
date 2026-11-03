import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ToastService } from '../core/toast.service';
import { ContactPage } from './contact-page';
import { ContactService } from './contact.service';

describe('ContactPage', () => {
  const contact = { send: vi.fn() };
  const toasts = { success: vi.fn() };

  async function render(): Promise<ComponentFixture<ContactPage>> {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        { provide: ContactService, useValue: contact },
        { provide: ToastService, useValue: toasts },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function fillAndSubmit(fixture: ComponentFixture<ContactPage>): Promise<HTMLElement> {
    const page = fixture.nativeElement as HTMLElement;
    const set = (selector: string, value: string) => {
      const field = page.querySelector<HTMLInputElement>(selector)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
    };
    set('[formControlName="name"]', 'Alice');
    set('[formControlName="email"]', 'a@b.co');
    set('[formControlName="message"]', 'Hello team');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    return page;
  }

  beforeEach(() => vi.resetAllMocks());

  it('sends the message and thanks the visitor', async () => {
    contact.send.mockReturnValue(of({}));
    const page = await fillAndSubmit(await render());

    expect(contact.send).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'a@b.co',
      message: 'Hello team',
    });
    expect(toasts.success).toHaveBeenCalledWith('Message sent');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Thanks for reaching out');
    expect(page.querySelector('form')).toBeNull();
  });

  it("shows the backend's error and keeps the form", async () => {
    contact.send.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Email must be a valid email address.' },
          }),
      ),
    );
    const page = await fillAndSubmit(await render());

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Email must be a valid email address.',
    );
    expect(page.querySelector('form')).not.toBeNull();
  });
});
