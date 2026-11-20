import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthConfig } from '../auth/auth-config';
import { buildSupabaseConfig } from '../auth/testing/auth.fixtures';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const service = {
    register: jest.fn(),
    logIn: jest.fn(),
    createProfile: jest.fn(),
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    getSavedRecipes: jest.fn(),
    saveRecipe: jest.fn(),
    unsaveRecipe: jest.fn(),
  };

  async function build(config: AuthConfig): Promise<UsersController> {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: service },
        { provide: AuthConfig, useValue: config },
      ],
    }).compile();
    return moduleRef.get(UsersController);
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    controller = await build(AuthConfig.development());
  });

  it('createProfile passes the signed-in id and the DTO', async () => {
    const dto = { username: 'jordan', displayName: 'Jordan' };
    await controller.createProfile('supabase-id', dto);
    expect(service.createProfile).toHaveBeenCalledWith('supabase-id', dto);
  });

  it('refuses username-only sign-up and log-in once Supabase is configured', async () => {
    const withSupabase = await build(buildSupabaseConfig());
    const dto = { username: 'peter', displayName: 'Peter' };

    expect(() => withSupabase.register(dto)).toThrow(ForbiddenException);
    expect(() => withSupabase.logIn(dto)).toThrow(ForbiddenException);
    expect(service.register).not.toHaveBeenCalled();
    expect(service.logIn).not.toHaveBeenCalled();
  });

  it('register delegates the DTO', async () => {
    const dto = { username: 'peter', displayName: 'Peter' };
    await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('findMe and findOne look up the right user', async () => {
    await controller.findMe('alice');
    await controller.findOne('bob');

    expect(service.findOne).toHaveBeenNthCalledWith(1, 'alice');
    expect(service.findOne).toHaveBeenNthCalledWith(2, 'bob');
  });

  it('getPreferences and updatePreferences act on the current user', async () => {
    const dto = { defaultServings: 3 };

    await controller.getPreferences('alice');
    await controller.updatePreferences('alice', dto);

    expect(service.getPreferences).toHaveBeenCalledWith('alice');
    expect(service.updatePreferences).toHaveBeenCalledWith('alice', dto);
  });

  it('updateMe delegates profile changes', async () => {
    await controller.updateMe('alice', { bio: 'Hi' });
    expect(service.updateProfile).toHaveBeenCalledWith('alice', { bio: 'Hi' });
  });

  it('saved-recipe routes delegate with the current user', async () => {
    service.getSavedRecipes.mockResolvedValue([]);
    await expect(controller.getSavedRecipes('alice')).resolves.toEqual([]);
    await controller.saveRecipe('alice', 'r1');
    await controller.unsaveRecipe('alice', 'r1');

    expect(service.getSavedRecipes).toHaveBeenCalledWith('alice');
    expect(service.saveRecipe).toHaveBeenCalledWith('alice', 'r1');
    expect(service.unsaveRecipe).toHaveBeenCalledWith('alice', 'r1');
  });

  it('logIn delegates the username', async () => {
    await controller.logIn({ username: 'peter' });
    expect(service.logIn).toHaveBeenCalledWith({ username: 'peter' });
  });
});
