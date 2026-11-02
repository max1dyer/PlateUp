/** A user's profile as returned by the backend's `/users` routes. */
export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  displayName: string;
  bio: string;
  profilePictureUrl: string | null;
  savedRecipeIds: string[];
}

/** Body of `POST /users` (create an account). */
export interface NewUser {
  username: string;
  displayName: string;
  bio?: string;
}

/** Body of `PATCH /users/me`; omitted fields stay unchanged, `null` removes the picture. */
export interface ProfileChanges {
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string | null;
}

/** Limits enforced by the backend's `User` entity, mirrored for form hints. */
export const MAX_USERNAME_LENGTH = 30;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 300;
