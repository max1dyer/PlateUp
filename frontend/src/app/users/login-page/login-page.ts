import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { MAX_DISPLAY_NAME_LENGTH, MAX_USERNAME_LENGTH, User } from '../user.models';

/** Whether the form signs in to an existing account or creates a new one. */
type Mode = 'log-in' | 'register';

/**
 * Sign-in page (`/login`): log in or create an account. With Supabase that takes an email and
 * password (plus a username and display name for a new account); in development, a username.
 * Afterwards the user returns to the page they first asked for.
 */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage implements OnInit {
  /** Which form is showing. */
  protected readonly mode = signal<Mode>('log-in');
  /** True while signing in or registering. */
  protected readonly saving = signal(false);
  /** The last validation or server error to show, or null. */
  protected readonly error = signal<string | null>(null);
  /** Shown after signing up when Supabase wants the email confirmed first. */
  protected readonly notice = signal<string | null>(null);
  /** True when signing in with Supabase (email and password). */
  protected readonly usesSupabase = computed(() => this.auth.provider() === 'supabase');
  /** True when a signed-in Supabase user still has to pick a username. */
  protected readonly needsProfile = computed(() => this.auth.needsProfile());
  protected readonly maxUsername = MAX_USERNAME_LENGTH;
  protected readonly maxDisplayName = MAX_DISPLAY_NAME_LENGTH;

  /** Every field either sign-in might need; the template shows only the relevant ones. */
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    displayName: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toasts: ToastService,
  ) {}

  /** Finds out which sign-in to show. */
  public ngOnInit(): void {
    this.auth.loadConfig().subscribe({
      error: () => this.error.set("We couldn't reach PlateUp. Make sure the backend is running."),
    });
  }

  /** Switches between the sign-in and register forms. */
  protected switchTo(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.notice.set(null);
  }

  /** Signs in, registers, or finishes the profile, then returns the user where they were going. */
  protected submit(): void {
    const details = this.form.getRawValue();
    const registering = this.mode() === 'register' || this.needsProfile();
    const problem = this.check(registering);
    if (problem !== null) {
      this.error.set(problem);
      return;
    }
    let request: Observable<User | null>;
    if (this.needsProfile()) {
      request = this.auth.completeProfile({
        username: details.username,
        displayName: details.displayName,
      });
    } else {
      request = registering ? this.auth.register(details) : this.auth.logIn(details);
    }
    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);
    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        if (user === null) {
          this.switchTo('log-in');
          this.notice.set('Check your email to confirm your account, then log in.');
          return;
        }
        this.toasts.success(
          registering
            ? `Welcome to PlateUp, ${user.displayName}!`
            : `Welcome back, ${user.displayName}!`,
        );
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Only follow in-app paths, so `returnUrl` cannot send the user to another site.
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/home');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  /** The first missing field's message, or null when the form is complete. */
  private check(registering: boolean): string | null {
    const { email, password, username, displayName } = this.form.getRawValue();
    const needsCredentials = this.usesSupabase() && !this.needsProfile();
    if (needsCredentials && email.trim().length === 0) {
      return 'Enter your email.';
    }
    if (needsCredentials && password.length === 0) {
      return 'Enter your password.';
    }
    if ((registering || !this.usesSupabase()) && username.trim().length === 0) {
      return registering ? 'Choose a username.' : 'Enter your username.';
    }
    if (registering && displayName.trim().length === 0) {
      return 'Enter the name other people will see.';
    }
    return null;
  }
}
