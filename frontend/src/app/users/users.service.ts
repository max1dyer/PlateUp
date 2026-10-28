import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PREFIX } from '../core/user-id.interceptor';

/** A user's public profile as returned by `GET /users/:userId`. */
export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePictureUrl: string | null;
}

/** All HTTP calls for user profiles. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${API_PREFIX}/users`;

  constructor(private readonly http: HttpClient) {}

  public getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${userId}`);
  }
}
