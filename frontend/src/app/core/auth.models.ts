/** Body of the backend's `GET /auth/config`: which sign-in to show. */
export type AuthClientConfig =
  | { provider: 'development' }
  | { provider: 'supabase'; supabaseUrl: string; supabaseAnonKey: string };

/** Which sign-in the app uses: Supabase email and password, or the username-only development one. */
export type AuthProvider = AuthClientConfig['provider'];

/** What the login form collects; Supabase needs the email and password, development the username. */
export interface LogInDetails {
  username: string;
  email: string;
  password: string;
}

/** What the create-account form collects. */
export interface SignUpDetails extends LogInDetails {
  displayName: string;
}

/** The profile fields saved with a new Supabase account, used to create its PlateUp profile. */
export interface ProfileDetails {
  username: string;
  displayName: string;
}

/** A Supabase session: the access token for the backend, and the profile saved at sign-up. */
export interface AuthSession {
  accessToken: string;
  /** Null when the account was made without them (e.g. in the Supabase dashboard). */
  profile: ProfileDetails | null;
}

/** A sign-in failure reported by Supabase (wrong password, unconfirmed email, ...). */
export class AuthError extends Error {}
