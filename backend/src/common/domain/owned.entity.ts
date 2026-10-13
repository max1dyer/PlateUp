import { BaseEntity } from './base.entity';

/** An entity that belongs to a single user (a recipe's author, a pantry's owner, ...). */
export abstract class OwnedEntity<TSnapshot extends object> extends BaseEntity<TSnapshot> {
  protected constructor(public readonly ownerId: string) {
    super();
  }

  public isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }
}
