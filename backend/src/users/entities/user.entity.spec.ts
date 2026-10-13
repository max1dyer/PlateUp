import { DomainValidationError } from '../../common/errors/domain-validation.error';
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

  it('saves and unsaves recipes without duplicates', () => {
    const user = new User('peter', profile);

    user.saveRecipe('r1');
    user.saveRecipe('r1');
    expect(user.savedRecipeIds).toEqual(['r1']);
    expect(user.hasSaved('r1')).toBe(true);

    user.unsaveRecipe('r1');
    expect(user.hasSaved('r1')).toBe(false);
  });
});
