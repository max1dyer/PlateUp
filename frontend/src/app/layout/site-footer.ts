import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Green footer shared by every page. */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {}
