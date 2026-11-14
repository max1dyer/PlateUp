/**
 * Body of `PATCH /users/me`. Omitted fields stay unchanged; `profilePictureUrl: null` removes the
 * picture.
 */
export class UpdateUserDto {
  public readonly displayName?: string;
  public readonly bio?: string;
  public readonly profilePictureUrl?: string | null;
}
