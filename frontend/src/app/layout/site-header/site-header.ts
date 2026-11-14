import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

/** One entry in the navigation bar. */
interface NavLink {
  label: string;
  path: string;
}

/** Orange navigation bar shared by every page. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  /** Navigation entries, in display order. */
  protected readonly links: readonly NavLink[] = [
    { label: 'Home', path: '/home' },
    { label: 'Recipes', path: '/recipes' },
    { label: 'Saved', path: '/saved' },
    { label: 'Pantry', path: '/pantry' },
    { label: 'Grocery', path: '/grocery' },
    { label: 'Planner', path: '/planner' },
    { label: 'Profile', path: '/profile' },
  ];

  /** Whether the collapsible menu is open (only visible on small screens). */
  protected readonly menuOpen = signal(false);

  constructor(
    protected readonly session: SessionService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toasts: ToastService,
  ) {}

  /** Opens or closes the small-screen menu. */
  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the small-screen menu (e.g. after a link is followed). */
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Signs the user out and returns to the login page. */
  protected logOut(): void {
    this.closeMenu();
    this.auth.logOut();
    this.toasts.success('You are logged out.');
    void this.router.navigateByUrl('/login');
  }
}
