import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Width of the Figma frame the link positions below were measured in. */
const FRAME_WIDTH = 402;

interface NavLink {
  label: string;
  path: string;
  /** Left edge and top of the label in the Figma frame, in px. */
  left: number;
  top: number;
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
    { label: 'Home', path: '/home', left: 84, top: 25 },
    { label: 'Recipes', path: '/recipes', left: 76, top: 46 },
    { label: 'Saved', path: '/saved', left: 84, top: 67 },
    { label: 'Pantry', path: '/pantry', left: 156, top: 67 },
    { label: 'Grocery', path: '/grocery', left: 233, top: 67 },
    { label: 'Planner', path: '/planner', left: 319, top: 25 },
    { label: 'Profile', path: '/profile', left: 324, top: 46 },
  ];

  protected readonly logOut = { label: 'Log out', left: 319, top: 67 };

  /** Converts a Figma x position to a percentage so the bar also fits narrower phones. */
  protected leftPercent(left: number): string {
    return `${(left / FRAME_WIDTH) * 100}%`;
  }
}
