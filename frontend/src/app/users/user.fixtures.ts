import { User } from './user.models';

/** Test data shaped like the backend's JSON. */
export function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
    username: 'casey',
    displayName: 'Casey Cook',
    bio: '',
    profilePictureUrl: null,
    savedRecipeIds: [],
    ...overrides,
  };
}
