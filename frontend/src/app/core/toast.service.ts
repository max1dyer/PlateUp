import { Injectable, signal } from '@angular/core';

/** One message currently on screen. */
export interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

/** How long a message stays on screen. */
const TOAST_MS = 3500;

/** Short confirmation messages ("Recipe saved") shown after a user action completes. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Increasing id so each toast can be dismissed individually. */
  private nextId = 1;
  /** Toasts on screen, oldest first. */
  private readonly shown = signal<readonly Toast[]>([]);

  /** Read-only view that `ToastOutlet` renders. */
  public readonly toasts = this.shown.asReadonly();

  /** Shows a confirmation message, e.g. "Recipe saved". */
  public success(message: string): void {
    this.show(message, 'success');
  }

  /** Shows a failure message. */
  public error(message: string): void {
    this.show(message, 'error');
  }

  /** Removes a toast early (e.g. when its close button is clicked). */
  public dismiss(id: number): void {
    this.shown.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /** Adds a toast and schedules its removal after `TOAST_MS`. */
  private show(message: string, kind: Toast['kind']): void {
    const toast = { id: this.nextId++, message, kind };
    this.shown.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.dismiss(toast.id), TOAST_MS);
  }
}
