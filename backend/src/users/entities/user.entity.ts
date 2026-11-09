import { BaseEntity } from '../../common/domain/base.entity';
import {
  requireImageSourceOrNull,
  requireMaxLength,
  requireText,
} from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { UserPreferences, UserPreferencesProps } from './user-preferences';

export const MAX_USERNAME_LENGTH = 30;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 300;

/** Lower-case letters, digits, dots, dashes and underscores. */
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

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

/**
 * A PlateUp account: a unique username, a public profile, the recipes the
 * user saved, and their private preferences. Preferences are left out of
 * `toJSON()` because profiles are public; they have their own route.
 */
export class User extends BaseEntity<UserSnapshot> {
  public readonly username: string;
  private profile: UserProfile;
  private readonly savedRecipes = new Set<string>();
  private prefs = UserPreferences.defaults();

  constructor(username: string, profile: UserProfile) {
    super();
    this.username = User.normalizeUsername(username);
    this.profile = User.validateProfile(profile);
  }

  /** Usernames are case-insensitive and stored in lower case. */
  public static normalizeUsername(username: string): string {
    const normalized = requireText(username, 'Username').toLowerCase();
    if (normalized.length > MAX_USERNAME_LENGTH || !USERNAME_PATTERN.test(normalized)) {
      throw new DomainValidationError(
        `Username must be at most ${MAX_USERNAME_LENGTH} letters, digits, dots, dashes, or underscores.`,
      );
    }
    return normalized;
  }

  public get displayName(): string {
    return this.profile.displayName;
  }

  public get savedRecipeIds(): string[] {
    return [...this.savedRecipes];
  }

  public get preferences(): UserPreferences {
    return this.prefs;
  }

  public updatePreferences(changes: Partial<UserPreferencesProps>): void {
    this.prefs = this.prefs.with(changes);
    this.touch();
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
    const displayName = requireText(profile.displayName, 'Display name');
    return {
      displayName: requireMaxLength(displayName, MAX_DISPLAY_NAME_LENGTH, 'Display name'),
      bio: requireMaxLength(profile.bio, MAX_BIO_LENGTH, 'Bio'),
      profilePictureUrl: requireImageSourceOrNull(profile.profilePictureUrl, 'Profile picture'),
    };
  }
}
