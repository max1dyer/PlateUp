import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/api';
import { UserNotification } from './notification.models';

/** HTTP calls for the signed-in user's notifications. Accept/reject live in `GroceryListsService`. */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly baseUrl = `${API_PREFIX}/notifications`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /notifications`: the user's notifications, newest first. */
  public getNotifications(): Observable<UserNotification[]> {
    return this.http.get<UserNotification[]>(this.baseUrl);
  }
}
