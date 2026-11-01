import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { ToastOutlet } from './layout/toast-outlet';

/** App shell: shared nav bar and footer around the current page, plus action messages. */
@Component({
  imports: [RouterOutlet, SiteHeader, SiteFooter, ToastOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
