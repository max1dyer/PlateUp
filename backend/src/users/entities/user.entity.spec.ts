import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { User } from './user.entity';

describe('User', () => {
  const profile = { displayName: 'Peter', bio: '', profilePictureUrl: null };

  it('normalizes the username to lower case', () => {
    expect(new User('  PeterJ ', profile).username).toBe('peterj');
  });

  it('requires a display name', () => {
    expect(() => new User('peter', { ...profile, displayName: ' ' })).toThrow(
      DomainValidationError,
    );
  });

  it('updateProfile merges changes', () => {
    const user = new User('peter', profile);

    user.updateProfile({ displayName: 'Peter Jones' });

    expect(user.displayName).toBe('Peter Jones');
    expect(user.toJSON().bio).toBe('');
  });

  it('updatePreferences changes preferences but keeps them out of the public JSON', () => {
    const user = new User('peter', profile);

    user.updatePreferences({ dietaryRestrictions: [DietaryRestriction.DairyFree] });

    expect(user.preferences.dietaryRestrictions).toEqual([DietaryRestriction.DairyFree]);
    expect(user.toJSON()).not.toHaveProperty('preferences');
    expect(user.toJSON()).not.toHaveProperty('dietaryRestrictions');
  });

  it('saves and unsaves recipes without duplicates', () => {
    const user = new User('peter', profile);

    user.saveRecipe('r1');
    user.saveRecipe('r1');
    expect(user.savedRecipeIds).toEqual(['r1']);
    expect(user.hasSaved('r1')).toBe(true);

    user.unsaveRecipe('r1');
    expect(user.hasSaved('r1')).toBe(false);
  });

  it('rejects usernames with spaces or symbols, or longer than 30 characters', () => {
    expect(() => new User('peter jones', profile)).toThrow(DomainValidationError);
    expect(() => new User('peter!', profile)).toThrow(DomainValidationError);
    expect(() => new User('p'.repeat(31), profile)).toThrow(DomainValidationError);
    expect(new User('peter_j-1.0', profile).username).toBe('peter_j-1.0');
  });

  it('limits the display name to 50 characters and the bio to 300', () => {
    expect(() => new User('peter', { ...profile, displayName: 'P'.repeat(51) })).toThrow(
      DomainValidationError,
    );
    expect(() => new User('peter', { ...profile, bio: 'b'.repeat(301) })).toThrow(
      DomainValidationError,
    );
    expect(new User('peter', { ...profile, bio: 'b'.repeat(300) }).toJSON().bio).toHaveLength(300);
  });

  it('accepts a web address or uploaded image as the profile picture', () => {
    const user = new User('peter', profile);

    user.updateProfile({ profilePictureUrl: 'https://example.com/me.png' });
    expect(user.toJSON().profilePictureUrl).toBe('https://example.com/me.png');
    user.updateProfile({ profilePictureUrl: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(user.toJSON().profilePictureUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
    user.updateProfile({ profilePictureUrl: '' });
    expect(user.toJSON().profilePictureUrl).toBeNull();
  });

  it('rejects a profile picture that is not an image source and keeps the old one', () => {
    const user = new User('peter', { ...profile, profilePictureUrl: 'https://example.com/a.png' });

    expect(() => user.updateProfile({ profilePictureUrl: 'javascript:alert(1)' })).toThrow(
      DomainValidationError,
    );
    expect(user.toJSON().profilePictureUrl).toBe('https://example.com/a.png');
  });
});
