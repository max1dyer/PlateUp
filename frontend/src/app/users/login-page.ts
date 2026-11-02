import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../core/api';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { MAX_DISPLAY_NAME_LENGTH, MAX_USERNAME_LENGTH, User } from './user.models';

type Mode = 'log-in' | 'register';

/**
 * Sign-in page (`/login`): log in with a username, or create an account.
 * Afterwards the user returns to the page they first asked for.
 */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  protected readonly mode = signal<Mode>('log-in');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly maxUsername = MAX_USERNAME_LENGTH;
  protected readonly maxDisplayName = MAX_DISPLAY_NAME_LENGTH;

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
    displayName: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toasts: ToastService,
  ) {}

  protected switchTo(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  protected submit(): void {
    const { username, displayName } = this.form.getRawValue();
    if (username.trim().length === 0) {
      this.error.set('Enter your username.');
      return;
    }
    const registering = this.mode() === 'register';
    if (registering && displayName.trim().length === 0) {
      this.error.set('Enter the name other people will see.');
      return;
    }
    const request: Observable<User> = registering
      ? this.auth.register({ username, displayName })
      : this.auth.logIn(username);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        this.toasts.success(
          registering
            ? `Welcome to PlateUp, ${user.displayName}!`
            : `Welcome back, ${user.displayName}!`,
        );
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/home');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
