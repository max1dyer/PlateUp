import { BaseEntity } from '../../common/domain/base.entity';
import { requireText } from '../../common/domain/guards';

/** The user-editable part of a profile. */
export interface UserProfile {
  displayName: string;
  bio: string;
  profilePictureUrl: string | null;
}

export interface UserSnapshot extends UserProfile {
  username: string;
  savedRecipeIds: string[];
}

export class User extends BaseEntity<UserSnapshot> {
  public readonly username: string;
  private profile: UserProfile;
  private readonly savedRecipes = new Set<string>();

  constructor(username: string, profile: UserProfile) {
    super();
    this.username = User.normalizeUsername(username);
    this.profile = User.validateProfile(profile);
  }

  /** Usernames are case-insensitive and stored in lower case. */
  public static normalizeUsername(username: string): string {
    return requireText(username, 'Username').toLowerCase();
  }

  public get displayName(): string {
    return this.profile.displayName;
  }

  public get savedRecipeIds(): string[] {
    return [...this.savedRecipes];
  }

  public updateProfile(changes: Partial<UserProfile>): void {
    this.profile = User.validateProfile({ ...this.profile, ...changes });
    this.touch();
  }

  public saveRecipe(recipeId: string): void {
    this.savedRecipes.add(recipeId);
    this.touch();
  }

  public unsaveRecipe(recipeId: string): void {
    if (this.savedRecipes.delete(recipeId)) {
      this.touch();
    }
  }

  public hasSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  protected snapshot(): UserSnapshot {
    return { username: this.username, ...this.profile, savedRecipeIds: this.savedRecipeIds };
  }

  private static validateProfile(profile: UserProfile): UserProfile {
    return {
      displayName: requireText(profile.displayName, 'Display name'),
      bio: profile.bio.trim(),
      profilePictureUrl: profile.profilePictureUrl,
    };
  }
}
