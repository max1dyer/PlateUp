import { Injectable, signal } from '@angular/core';

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
  private nextId = 1;
  private readonly shown = signal<readonly Toast[]>([]);

  public readonly toasts = this.shown.asReadonly();

  public success(message: string): void {
    this.show(message, 'success');
  }

  public error(message: string): void {
    this.show(message, 'error');
  }

  public dismiss(id: number): void {
    this.shown.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, kind: Toast['kind']): void {
    const toast = { id: this.nextId++, message, kind };
    this.shown.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.dismiss(toast.id), TOAST_MS);
  }
}
