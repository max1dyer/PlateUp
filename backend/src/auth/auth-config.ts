/**
 * Which sign-in the app uses, read once from environment variables (see `backend/.env.example`).
 *
 * With `SUPABASE_URL` and `SUPABASE_ANON_KEY` set, users sign in through Supabase and every
 * request must carry a Supabase access token. Without them the app falls back to the development
 * sign-in, which trusts the `x-user-id` header, so it still runs before the keys are shared.
 */
export class AuthConfig {
  private constructor(
    /** Project URL, e.g. `https://abcd.supabase.co`, or null in development mode. */
    public readonly supabaseUrl: string | null,
    /** Public ("anon") key the frontend's Supabase client needs; safe to send to browsers. */
    public readonly supabaseAnonKey: string | null,
    /**
     * Legacy JWT secret. Only projects that still sign tokens with a shared secret (HS256) need
     * it; newer projects publish their signing keys, which are fetched instead.
     */
    public readonly jwtSecret: string | null,
  ) {}

  /** Reads the settings from `env` (normally `process.env`); blank values count as unset. */
  public static fromEnv(env: Record<string, string | undefined>): AuthConfig {
    const read = (name: string) => env[name]?.trim() || null;
    const url = read('SUPABASE_URL');
    return new AuthConfig(
      // Without a trailing slash, so `${url}/auth/v1` is always well formed.
      url === null ? null : url.replace(/\/+$/, ''),
      read('SUPABASE_ANON_KEY'),
      read('SUPABASE_JWT_SECRET'),
    );
  }

  /** Development mode: no Supabase settings. */
  public static development(): AuthConfig {
    return new AuthConfig(null, null, null);
  }

  /** True when users sign in through Supabase. */
  public get usesSupabase(): boolean {
    return this.supabaseUrl !== null && this.supabaseAnonKey !== null;
  }

  /** What the frontend needs to start its sign-in (`GET /auth/config`); never the secret. */
  public toJSON(): AuthClientConfig {
    if (this.supabaseUrl === null || this.supabaseAnonKey === null) {
      return { provider: 'development' };
    }
    return {
      provider: 'supabase',
      supabaseUrl: this.supabaseUrl,
      supabaseAnonKey: this.supabaseAnonKey,
    };
  }
}

/** Body of `GET /auth/config`. */
export type AuthClientConfig =
  | { provider: 'development' }
  | { provider: 'supabase'; supabaseUrl: string; supabaseAnonKey: string };
