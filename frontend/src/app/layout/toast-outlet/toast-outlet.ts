import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';

/** Shows confirmation and error messages from `ToastService` above the page. */
@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.html',
  styleUrl: './toast-outlet.css',
})
export class ToastOutlet {
  /**
   * @param toasts - Exposed to the template, which renders `toasts.toasts()` and dismisses them.
   */
  constructor(protected readonly toasts: ToastService) {}
}
