import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

/** Route data for an `InfoPage`. */
export interface InfoPageData {
  title: string;
  paragraphs: string[];
}

/**
 * A simple text page whose content comes from route data: About, Contact,
 * and placeholders for features scheduled for a later release (the Planner).
 */
@Component({
  selector: 'app-info-page',
  imports: [RouterLink],
  template: `
    <div class="ui-page">
      <h1 class="ui-title">{{ page()?.title }}</h1>
      @for (paragraph of page()?.paragraphs; track $index) {
        <p class="text">{{ paragraph }}</p>
      }
      <a class="ui-button primary" routerLink="/recipes">Browse recipes</a>
    </div>
  `,
  styles: `
    .text {
      margin: 0;
      font-size: 19px;
      line-height: 130%;
    }
  `,
})
export class InfoPage {
  protected readonly page;

  constructor(route: ActivatedRoute) {
    this.page = toSignal(route.data.pipe(map((data) => data['page'] as InfoPageData)));
  }
}
