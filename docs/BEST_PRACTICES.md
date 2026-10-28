# Best Practices

Covers all five mandatory practices and **eight** of the optional practices: automated testing, build tools, unit test tools, mock objects, dependency injection with unit tests, a linting system, third-party components, and design patterns.

> **Maintaining this file:** sections marked **TODO (evidence)** need screenshots, links, or counts gathered near the Final Release. Keep file paths current as the code changes, because graders will follow them.

| #   | Practice                             | Status | Primary evidence                                         |
| --- | ------------------------------------ | ------ | -------------------------------------------------------- |
| 1a  | Project management web site (GitHub) | In use | GitHub Issues, Pull Requests                             |
| 1b  | Task tracking web site (Jira)        | In use | Jira board and sprint reports                            |
| 1c  | Code repository (GitHub)             | In use | `github.com/max1dyer/PlateUp`                            |
| 1d  | Documented coding standards          | In use | [`CODING_STANDARDS.md`](CODING_STANDARDS.md)             |
| 1e  | Object-oriented design concepts      | In use | Defined below, [`DESIGN.md`](DESIGN.md)                  |
| 2a  | Automated testing                    | In use | `.github/workflows/ci.yml`, `*.spec.ts`                  |
| 2b  | Build tools                          | In use | npm workspaces, Nest CLI, Angular CLI                    |
| 2c  | Unit test tools                      | In use | Jest (backend), Vitest (frontend)                        |
| 2d  | Mock objects in unit tests           | In use | Controller specs, frontend component specs               |
| 2e  | Dependency injection with unit tests | In use | Repository DI tokens, `Test.createTestingModule`         |
| 2f  | Linting system                       | In use | ESLint + Prettier, enforced in CI                        |
| 2g  | Third-party components               | In use | [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)       |
| 2h  | Design patterns                      | In use | [`DESIGN.md` Design patterns](DESIGN.md#design-patterns) |

---

## 1. Mandatory Best Practices

### 1a. Project Management Web Site: GitHub

We use GitHub to manage the project, beyond hosting the code:

- **Issues** track bugs, feature requests, and feedback from demos and interface testing. Each issue is labelled (`bug`, `feature`, `docs`, `test`) and linked to the pull request that closes it (`Closes #N` in the PR description).
- **Pull Requests** are the only way code reaches `main`. Each PR is reviewed by at least one other member before merging (see [`CODING_STANDARDS.md`](CODING_STANDARDS.md#1-git--github-workflow)).
- **GitHub Actions** runs our CI pipeline on every PR (see 2a).

**TODO (evidence):** screenshot of the Issues tab (open and closed counts), one representative issue, PR, merge chain, and the closed-PR count at Final Release.

### 1b. Project Task Tracking Web Site: Jira

Every work package from the Work Breakdown Structure ([`sprint4.md` Part 6](sprint4.md)) becomes a Jira issue with an owner and target sprint. Sprints are one week long and end at the Wednesday 2:00 pm team meeting, where the board is reviewed and the next sprint is planned. Blocked work is moved to the **Blocked** column with a comment, per the [Team Agreement](TEAM_AGREEMENT.md).

GitHub and Jira are linked by convention: branch names and PR titles should include the Jira key. This lets each Jira task be traced to its code.

**TODO (evidence):** sprint board screenshots (one per release)...

### 1c. Code Repository: GitHub

Repository: `https://github.com/max1dyer/PlateUp`.

- npm-workspaces monorepo: `backend/` (NestJS) and `frontend/` (Angular).
- Feature-branch workflow with Conventional Commit messages ([`CODING_STANDARDS.md`](CODING_STANDARDS.md#1-git--github-workflow)).
- `main` is protected: merging requires a passing CI run and an approving review.

**TODO (evidence):** branch-protection settings screenshot, contributor graph, and commit count per member.

### 1d. Documented Coding Standards

Our standards are in [`CODING_STANDARDS.md`](CODING_STANDARDS.md). We adopted the published **Google TypeScript Style Guide** and the **official Angular style guide** as the base, and documented the project-specific rules on top of them: naming, brace placement, file layout, TSDoc comments, how design patterns are annotated, and the layering rules for NestJS and Angular.

The standards are enforced by tools, so we do not rely on reviewers to catch style problems:

| Rule area                                                    | Enforced by                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Indentation, quotes, semicolons, line width, brace placement | Prettier (`.prettierrc`), `.editorconfig`                             |
| Unused variables, `any`, unsafe patterns                     | ESLint (`.eslintrc.json`)                                             |
| Strict typing                                                | `"strict": true` in `backend/tsconfig.json`, Angular strict templates |
| Both of the above on every PR                                | GitHub Actions (`format:check`, `lint`)                               |

### 1e. Object-Oriented Design: Abstraction, Encapsulation, Inheritance, Polymorphism

The backend uses a layered, domain-driven design: entities own their data and rules, services coordinate them, and abstract repositories hide storage. Each core OO concept appears in the code as follows. File paths are relative to `backend/src/`.

**Abstraction:** exposing _what_ an object does while hiding _how_.

- `common/persistence/repository.ts`: `Repository<T>` is an abstract class that declares `findAll`, `findById`, `save`, and `delete` with no storage details. Feature subclasses such as `RecipeRepository` add domain queries (`findVisibleTo(userId)`). Services depend only on these abstractions, never on how or where data is stored.
- `common/domain/base.entity.ts`: `BaseEntity` declares the abstract method `snapshot()`. Every entity must say what it serializes, but `BaseEntity` decides how serialization works.
- `common/domain/quantity.ts`: callers ask a `Quantity` to `scale(factor)`. They never compute amounts themselves.

**Encapsulation:** keeping state private and changing it only through methods that preserve its rules.

- `recipes/entities/recipe.entity.ts`: a `Recipe`'s content is held in a `private details` field. It can be read through getters and changed only through `update(changes)`, which re-validates the whole recipe (a title, at least one ingredient, at least one step, positive servings). An invalid `Recipe` therefore cannot exist.
- `users/entities/user.entity.ts`: saved recipes are stored in a `private` `Set` and exposed through `saveRecipe`, `unsaveRecipe`, `hasSaved`, and a copied array.
- `grocery-lists/entities/grocery-list.entity.ts`: items are held in a `private` `Map`. All changes go through `addItem`, `updateItem`, and `removeItem` on the `GroceryList` aggregate root.
- `Quantity` is immutable (`readonly` fields). Every operation returns a new instance.

**Inheritance:** sharing structure and behaviour through an "is-a" hierarchy.

```
BaseEntity<T>                 (id, createdAt, updatedAt, toJSON)
├── User
├── GroceryListItem
└── OwnedEntity<T>            (+ ownerId, isOwnedBy)
    ├── Recipe
    ├── PantryItem
    └── GroceryList

Repository<T>                 (abstract storage contract)
├── RecipeRepository, PantryItemRepository, GroceryListRepository, UserRepository   (abstract DI tokens)
└── InMemoryRepository<T>     (Map-backed implementation)
    └── InMemoryRecipeRepository, InMemoryPantryItemRepository, ...                 (extend InMemoryRepository, implement the feature token)

Error
└── DomainValidationError
```

**Polymorphism:** one interface, many implementations, chosen at run time.

- `BaseEntity.toJSON()` calls `this.snapshot()`, and each subclass (`Recipe`, `User`, `PantryItem`, ...) supplies its own version. Nest serializes every entity the same way, whatever its type.
- `RecipesService` calls `this.recipes.findVisibleTo(userId)` on a `RecipeRepository`. The concrete object is an `InMemoryRecipeRepository` today and will be a database-backed repository later. In tests it may be a mock. The service code is identical in all three cases.
- `DomainErrorFilter` implements Nest's `ExceptionFilter` interface, so the framework calls it like any other filter.
- **TODO:** planned Beta polymorphism includes social-media import parsers (`TikTokParser`, `InstagramParser`, `YouTubeParser` behind one `RecipeTextParser` interface) and grocery-list generation strategies ("add all ingredients" vs. "add only missing ingredients").

---

## 2. Other Best Practices (eight adopted)

### 2a. Automated Testing

Every push and pull request to `main` or `develop` triggers the GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It installs dependencies with `npm ci`, then checks formatting, runs the linter, runs **all backend and frontend unit tests**, and builds both workspaces. A failure at any step blocks the merge.

- **Functionality** is tested at three levels in the backend: entity specs (business rules such as scaling and visibility), service specs (use-case flows against the in-memory repository), and controller specs (HTTP → service delegation).
- **Interface operation** is tested in the frontend: component specs render components with Angular's `TestBed` and assert on the DOM (e.g. grouping, counts, and error states on the grocery-list page). HTTP service specs check each request against `HttpTestingController`.

Where to find tests: every `*.spec.ts` file sits next to the file it tests, e.g. `backend/src/recipes/recipes.service.spec.ts` and `frontend/src/app/app.spec.ts`.

**TODO (evidence):** final test count and coverage per workspace (target ≥70% statements, per Supplemental Spec 3.5), and a screenshot of a passing and a failing CI run.

### 2b. Build Tools

The project is built with standard, repeatable tools rather than shell scripts:

- **npm workspaces** (root `package.json`) handle dependency installation and pinning (`package-lock.json`, `npm ci`) and orchestrate tasks across both workspaces (`npm run build|test|lint`).
- **Nest CLI** (`nest build`) compiles the backend TypeScript to `backend/dist/` using `backend/tsconfig.json`.
- **Angular CLI** with `@angular/build` (esbuild/Vite) compiles, bundles, and optimizes the frontend into `frontend/dist/` (`angular.json`).

### 2c. Unit Test Tools

- **Backend: Jest** with `ts-jest` (configured in `backend/package.json`), plus `@nestjs/testing` to build isolated DI containers per test.
- **Frontend: Vitest**, run through Angular's `@angular/build:unit-test` builder with `jsdom`, plus Angular `TestBed` and `HttpTestingController`.

### 2d. Mock Objects in Unit Tests

Mocks let us test one class at a time without starting a server, network, or database:

- **Backend controller specs** (`backend/src/*/*.controller.spec.ts`) replace the real service with a mock built from `jest.fn()`. For example, `recipes.controller.spec.ts` checks that `RecipesController.findAll('alice')` calls `RecipesService.findAllVisibleTo('alice')`, without running any recipe logic.
- **Frontend component specs** replace HTTP services with `vi.fn()` mocks that return `of(...)` or `throwError(...)`. This lets us test loading and error states deterministically (e.g. `grocery-list-page.spec.ts`).
- **Frontend HTTP service specs** use Angular's `HttpTestingController` as a mock HTTP backend.
- The **in-memory repositories** act as lightweight fakes. They remove the database dependency from service tests.
- **TODO (Beta):** mock the external Kroger, USDA, and API Ninjas clients, including the forced 16-second-timeout test required by Supplemental Spec 3.4.

### 2e. Dependency Injection in Conjunction with Unit Tests

All collaborators are injected through constructors, never created with `new` inside the class:

- Each service depends on an **abstract** repository class (e.g. `constructor(private readonly recipes: RecipeRepository)`). The feature module decides which implementation to inject: `{ provide: RecipeRepository, useClass: InMemoryRecipeRepository }` in `recipes.module.ts`.
- Tests use the same mechanism to substitute dependencies. Service specs call `Test.createTestingModule({ providers: [RecipesService, { provide: RecipeRepository, useClass: InMemoryRecipeRepository }] })`. Controller specs inject `{ provide: RecipesService, useValue: mockService }`.
- On the frontend, components inject services (`constructor(private readonly groceryLists: GroceryListsService)`), and specs override them with `TestBed` providers.

Because of this, swapping the in-memory store for a real database changes one line per module and no service or test code.

### 2f. Linting System

- **ESLint** (`.eslintrc.json`) with `@typescript-eslint` and `eslint:recommended`. It flags unused variables, use of `any`, and other likely logic errors.
- **Prettier** (`.prettierrc`, `.editorconfig`) enforces formatting. `eslint-config-prettier` keeps the two from conflicting.
- Developers run `npm run format` and `npm run lint` before committing. CI runs `format:check` and `lint` and blocks merging on any error.

**TODO (evidence):** an example PR where CI caught a lint or format error.

### 2g. Third-Party Components

PlateUp is built on open-source frameworks and libraries, including NestJS, Angular, RxJS, Express, Jest, Vitest, ESLint, and Prettier. External services are planned for the Beta release: Supabase, Kroger API, USDA FoodData Central, and API Ninjas. Each component's license and our attribution are listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

### 2h. Design Patterns

The patterns we use are catalogued in [`DESIGN.md`](DESIGN.md#design-patterns), with where each one appears and why we chose it. Each use is also annotated in the source with a `@pattern` TSDoc tag ([`CODING_STANDARDS.md` 4](CODING_STANDARDS.md)). Summary of patterns from the course list:

| Pattern                                     | Where                                                                           | Why                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Dependency Injection                        | Every service/controller constructor, module `providers`                        | Swap storage and mock collaborators without changing consumers.                           |
| Template Method                             | `BaseEntity.toJSON()` → abstract `snapshot()`                                   | One serialization algorithm. Subclasses supply only their own fields.                     |
| Mock Objects                                | Controller and component specs                                                  | Test one class in isolation.                                                              |
| Singleton                                   | Nest providers (default singleton scope), Angular `providedIn: 'root'` services | One shared repository/service instance per application.                                   |
| Chain of Responsibility                     | Angular HTTP interceptors (`userIdInterceptor`), Nest exception filters         | Cross-cutting request handling, with each handler choosing to act or pass the request on. |
| Adapter                                     | `DomainErrorFilter` (domain error → HTTP response)                              | Keeps the domain layer free of HTTP concerns.                                             |
| **TODO/Planned:** Strategy                  | Grocery-list generation (all vs. missing-only); recipe sort/filter              | User setting chooses the algorithm at run time.                                           |
| **TODO/Planned:** Factory Method / Strategy | Social-media import parsers                                                     | Spec 3.5: a new platform should require one new parser module only.                       |
| **TODO/Planned:** Observer                  | Household grocery-list live updates (WebSocket + RxJS)                          | Push changes to all members within 2 seconds.                                             |
| **TODO/Planned:** Facade + Proxy            | External API clients (shared timeout wrapper, response cache)                   | One simple interface. Caching and the 15-second timeout in one place.                     |
