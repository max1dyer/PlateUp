import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { ContactMessage, NewContactMessage } from './contact.models';

/** HTTP calls behind the Contact page. No sign-in is needed. */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly baseUrl = `${API_PREFIX}/contact-messages`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /contact-messages`: sends a visitor's message to the team. */
  public send(message: NewContactMessage): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(this.baseUrl, message);
  }
}
