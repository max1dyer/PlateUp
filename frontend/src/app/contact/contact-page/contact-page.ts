import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { ToastService } from '../../core/toast.service';
import { MAX_CONTACT_MESSAGE_LENGTH, MAX_CONTACT_NAME_LENGTH } from '../contact.models';
import { ContactService } from '../contact.service';

/** The Contact Us page: a form for sending the team a message. */
@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css',
})
export class ContactPage {
  // Length limits, shown as hints and enforced with `maxlength` in the template.
  protected readonly maxName = MAX_CONTACT_NAME_LENGTH;
  protected readonly maxMessage = MAX_CONTACT_MESSAGE_LENGTH;
  /** True while the message is being sent (disables the button). */
  protected readonly sending = signal(false);
  /** True after a successful send; the page then shows a thank-you note instead of the form. */
  protected readonly sent = signal(false);
  /** The last send error to show above the form, or null. */
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly contact: ContactService,
    private readonly toasts: ToastService,
  ) {}

  /**
   * Sends the form to the team. On success the form is cleared and the thank-you note shown; on
   * failure the backend's message is shown and the entries are kept.
   */
  protected send(): void {
    this.sending.set(true);
    this.error.set(null);
    this.contact.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this.form.reset();
        this.toasts.success('Message sent');
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  /** "Send another message": shows the (now empty) form again. */
  protected writeAnother(): void {
    this.sent.set(false);
  }
}
