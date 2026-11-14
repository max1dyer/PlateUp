import { BaseEntity } from './base.entity';

/** An entity that belongs to a single user (a recipe's author, a pantry's owner, ...). */
export abstract class OwnedEntity<TSnapshot extends object> extends BaseEntity<TSnapshot> {
  /** @param ownerId - Id of the user this entity belongs to; it never changes. */
  protected constructor(public readonly ownerId: string) {
    super();
  }

  /**
   * True if `userId` is this entity's owner. Services use it to hide or protect other users' data.
   */
  public isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }
}
