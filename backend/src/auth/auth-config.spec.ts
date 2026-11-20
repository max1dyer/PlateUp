import { AuthConfig } from './auth-config';

describe('AuthConfig', () => {
  it('uses the development sign-in when the Supabase settings are missing or blank', () => {
    expect(AuthConfig.fromEnv({}).usesSupabase).toBe(false);
    expect(AuthConfig.fromEnv({ SUPABASE_URL: 'https://x.supabase.co' }).usesSupabase).toBe(false);
    expect(AuthConfig.fromEnv({ SUPABASE_URL: ' ', SUPABASE_ANON_KEY: ' ' }).usesSupabase).toBe(
      false,
    );
    expect(AuthConfig.development().toJSON()).toEqual({ provider: 'development' });
  });

  it('uses Supabase with a URL and anon key, and never exposes the secret', () => {
    const config = AuthConfig.fromEnv({
      SUPABASE_URL: 'https://x.supabase.co/',
      SUPABASE_ANON_KEY: 'anon',
      SUPABASE_JWT_SECRET: 'secret',
    });

    expect(config.usesSupabase).toBe(true);
    expect(config.supabaseUrl).toBe('https://x.supabase.co');
    expect(config.toJSON()).toEqual({
      provider: 'supabase',
      supabaseUrl: 'https://x.supabase.co',
      supabaseAnonKey: 'anon',
    });
  });
});
