import { Component } from '@angular/core';
import { ToastService } from '../core/toast.service';

/** Shows confirmation and error messages from `ToastService` above the page. */
@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.html',
  styleUrl: './toast-outlet.css',
})
export class ToastOutlet {
  constructor(protected readonly toasts: ToastService) {}
}
