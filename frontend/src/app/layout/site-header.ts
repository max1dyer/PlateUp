import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';

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

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logOut(): void {
    this.closeMenu();
    this.auth.logOut();
    this.toasts.success('You are logged out.');
    void this.router.navigateByUrl('/login');
  }
}
