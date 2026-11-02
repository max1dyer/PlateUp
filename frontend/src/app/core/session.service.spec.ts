import { TestBed } from '@angular/core/testing';
import { user } from '../users/user.fixtures';
import { SessionService } from './session.service';

describe('SessionService', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the signed-in user id across page loads', () => {
    TestBed.inject(SessionService).setUser(user({ id: 'user-7' }));
    TestBed.resetTestingModule();

    const reloaded = TestBed.inject(SessionService);

    expect(reloaded.userId()).toBe('user-7');
    // The profile itself is loaded again by AuthService.restore().
    expect(reloaded.isSignedIn()).toBe(false);
  });

  it('clear forgets the user', () => {
    const session = TestBed.inject(SessionService);
    session.setUser(user());

    session.clear();

    expect(session.userId()).toBeNull();
    expect(session.currentUser()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
