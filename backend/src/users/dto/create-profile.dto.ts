/**
 * Body of `POST /users/me`: the PlateUp profile for a user who just signed up through Supabase.
 * The account's id comes from their access token, not the body.
 */
export class CreateProfileDto {
  public readonly username!: string;
  public readonly displayName!: string;
  public readonly bio?: string;
}
