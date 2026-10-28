# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

PlateUp is a recipe, pantry, grocery-list, and meal-planner web app built and documented in an object-oriented fashion, and future deliverable requirements in mind.

- **Interim release (Fri 11/6):** design-approach paragraph (SOLID + design patterns), ≥2 UML sequence diagrams of real use cases, CRC cards for every major class (with cohesion/coupling ratings), a static UML class diagram that _accurately reflects the source_, and an interface-testing summary.
- **Beta release (Fri 12/4):** ≥80% of "Must" requirements, code review with another team, test plan / test-case specification / test-results template.
- **Final release:** installable build with instructions, final test results, and best-practices evidence.

Where things live:

- `docs/sprint1.md` – vision, feature tiers, personas. `docs/sprint4.md` – user stories, FURPS+ supplemental spec (MoSCoW), use cases UC1–UC26, work breakdown, and the schedule (7.1 Interim scope, 7.2 Beta scope). These files embed base64 images, so **grep for headings instead of reading them whole**.
- `docs/CODING_STANDARDS.md` – the team's adopted standard. Follow it.
- `docs/DESIGN.md` – architecture, design-pattern registry, SOLID notes; the source for the Interim design paragraph, CRC cards, and diagrams.
- `docs/BEST_PRACTICES.md` – evidence of each graded best practice. When you add something that counts as evidence (a new pattern, mock, linter rule, CI step, third-party library), update the matching section.
- `docs/THIRD_PARTY_NOTICES.md` – attribution for third-party components. Add any new runtime dependency or external API here.

Because the class diagram and CRC cards must match the code, **when you add, rename, or remove a domain class, service, or repository, update `docs/DESIGN.md` in the same change.**

## Commands

npm workspaces monorepo (`backend`, `frontend`); run everything from the repo root. Node 22 (CI).

```bash
npm install
npm run dev --workspace=backend      # NestJS on http://localhost:3000 (watch mode)
npm run start --workspace=frontend   # Angular on http://localhost:4200
npm run format                       # Prettier write
npm run format:check                 # Prettier check (CI)
npm run lint                         # ESLint over all .ts (CI)
npm run test                         # both workspaces (CI)
npm run build                        # both workspaces (CI)
```

Single tests:

```bash
# Backend (Jest, rootDir backend/src)
npm test --workspace=backend -- src/recipes/recipes.service.spec.ts
npm test --workspace=backend -- -t "hides other users"
# Frontend (Vitest via @angular/build:unit-test; watch is on by default in a TTY)
npm test --workspace=frontend -- --watch=false --include src/app/app.spec.ts
npm test --workspace=frontend -- --watch=false --filter "GroceryListPage"
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, `format:check`, `lint`, `test`, `build` on pushes/PRs to `main` and `develop`. Run `npm run format` before finishing, since CI fails on formatting alone.

## Backend architecture (`backend/src`)

NestJS. Each feature folder (`users`, `recipes`, `pantry`, `grocery-lists`) has the same layers, and requests always flow **Controller → Service → abstract Repository → Entity**:

- **Controllers** only map HTTP to service calls. The acting user comes from the `@CurrentUserId()` param decorator (`common/decorators`), which for now reads an `x-user-id` header. When Supabase auth lands, only this decorator changes.
- **Services** orchestrate. They load aggregates from the repository, call entity methods, save, and translate "not found / not yours" into `NotFoundException` / `ForbiddenException`. Another user's private resource is reported as **404, not 403**, so its existence is not leaked.
- **Entities hold the business rules.** All extend `BaseEntity<TSnapshot>` (id, timestamps). User-owned ones extend `OwnedEntity` (`ownerId`, `isOwnedBy`). State is private. `toJSON()` is a Template Method that merges base fields with the subclass's `snapshot()`, so controllers return entities directly and Nest serializes them.
- **Validation lives in the domain, not in DTOs.** DTOs are plain classes with no `class-validator`. Entities validate in their constructor/mutators using `common/domain/guards.ts` (`requireText`, `requirePositiveInteger`, ...) and throw `DomainValidationError`, which the global `DomainErrorFilter` (registered via `APP_FILTER` in `app.module.ts`) turns into HTTP 400. Entities must not import from `@nestjs/*`.
- **Repositories:** `common/persistence/Repository<T>` is an abstract class. Each feature subclasses it (e.g. `RecipeRepository`) to add queries, and **that abstract class is the DI token** services inject. The module binds it with `{ provide: RecipeRepository, useClass: InMemoryRecipeRepository }`. Storage is in-memory (`InMemoryRepository`, a `Map`), so data resets on restart. A database is added by writing a new subclass and changing `useClass`, with no service changes.
- **`Quantity`** (`common/domain/quantity.ts`) is an immutable value object shared by recipes, the pantry, and grocery lists. Use `scale()` for servings. Never mutate amounts directly.
- Cross-feature dependencies go through exported services (e.g. `UsersModule` imports `RecipesModule` to use `RecipesService` for saved recipes), never through another feature's repository.

Testing conventions: service specs build a real Nest testing module with the in-memory repository. Controller specs replace the service with a `jest.fn()` mock via `{ provide: X, useValue: mock }`. Entity specs construct entities directly. Shared test data comes from builder functions in a feature's `testing/` folder (e.g. `buildCreateRecipeDto(overrides)`).

## Frontend architecture (`frontend/src`)

Angular 22 with standalone components and signals. Tests run with Vitest (`vi.fn()`). The standard: components never call `fetch` or touch the DOM directly. HTTP goes through an injectable service per feature.
