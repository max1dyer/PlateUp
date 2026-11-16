/** Body of `POST /grocery-lists/:listId/planner-week`. */
export class AddPlannerWeekDto {
  /** First day of the planned meals to shop for (`YYYY-MM-DD`). */
  public readonly from!: string;
  /** Last day of the planned meals to shop for (`YYYY-MM-DD`, inclusive). */
  public readonly to!: string;
  /** When true (the default), amounts the pantry already holds are left off (UC6). */
  public readonly usePantry?: boolean;
}
