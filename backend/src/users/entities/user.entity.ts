import { BaseEntity } from '../../common/domain/base.entity';
import {
  requireImageSourceOrNull,
  requireMaxLength,
  requireText,
} from '../../common/domain/guards';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { UserPreferences, UserPreferencesChanges } from './user-preferences';

/** Longest allowed username, display name, and bio, in characters. */
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

/** The public fields a user serializes to (preferences are deliberately not included). */
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
  /** Ids of recipes the user saved; a set so saving twice has no effect. */
  private readonly savedRecipes = new Set<string>();
  /** Private settings; replaced (never mutated) because `UserPreferences` is immutable. */
  private prefs = UserPreferences.defaults();

  /** @throws DomainValidationError if the username or any profile field is invalid. */
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

  /** The name shown on the user's profile and recipes. */
  public get displayName(): string {
    return this.profile.displayName;
  }

  /** A copy of the ids of the recipes the user saved, in the order they were saved. */
  public get savedRecipeIds(): string[] {
    return [...this.savedRecipes];
  }

  /** The user's current private preferences. */
  public get preferences(): UserPreferences {
    return this.prefs;
  }

  /** Applies a partial preferences edit; the whole result is validated. */
  public updatePreferences(changes: UserPreferencesChanges): void {
    this.prefs = this.prefs.with(changes);
    this.touch();
  }

  /** Applies a partial profile edit; the whole result is validated. */
  public updateProfile(changes: Partial<UserProfile>): void {
    this.profile = User.validateProfile({ ...this.profile, ...changes });
    this.touch();
  }

  /** Adds a recipe to the user's saved recipes (saving one twice has no effect). */
  public saveRecipe(recipeId: string): void {
    this.savedRecipes.add(recipeId);
    this.touch();
  }

  /** Removes a recipe from the user's saved recipes. Does nothing if it was not saved. */
  public unsaveRecipe(recipeId: string): void {
    if (this.savedRecipes.delete(recipeId)) {
      this.touch();
    }
  }

  /** True if the user has saved this recipe. */
  public hasSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  /** The public profile fields for `toJSON()` (preferences are left out on purpose). */
  protected snapshot(): UserSnapshot {
    return { username: this.username, ...this.profile, savedRecipeIds: this.savedRecipeIds };
  }

  /**
   * Returns a trimmed, validated copy of the profile fields.
   *
   * @throws DomainValidationError if the display name is blank or a field is too long or invalid.
   */
  private static validateProfile(profile: UserProfile): UserProfile {
    const displayName = requireText(profile.displayName, 'Display name');
    return {
      displayName: requireMaxLength(displayName, MAX_DISPLAY_NAME_LENGTH, 'Display name'),
      bio: requireMaxLength(profile.bio, MAX_BIO_LENGTH, 'Bio'),
      profilePictureUrl: requireImageSourceOrNull(profile.profilePictureUrl, 'Profile picture'),
    };
  }
}
