export class CreateUserDto {
  public readonly username!: string;
  public readonly displayName!: string;
  public readonly bio?: string;
  public readonly profilePictureUrl?: string;
}
