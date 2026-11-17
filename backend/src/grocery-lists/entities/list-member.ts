/** A user as shown on a shared grocery list: their id and the name to display. */
export interface ListMember {
  id: string;
  name: string;
}

/** One recent change to a shared list, e.g. Sam "added Milk". */
export interface ListActivity {
  by: ListMember;
  /** What happened, without the actor, e.g. "checked off Milk". */
  message: string;
  /** ISO timestamp. */
  at: string;
}
