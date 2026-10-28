# Coding Standards

All PlateUp code follows these standards. They build on two published guides, and the rules below take precedence where they differ:

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) for all TypeScript.
- [Angular Style Guide](https://angular.dev/style-guide) for frontend code.

Most rules are enforced by tools (Prettier, ESLint, the TypeScript compiler, and CI). Rules marked _(review)_ are checked by reviewers during pull-request review.

---

## 1. Git & GitHub Workflow

We use a feature-branch workflow. No feature work is committed directly to `main`.

### Branch Naming Conventions

Use a type prefix, the Jira key when there is one, and a kebab-case description:

- `feat/` – new functionality (e.g. `feat/PLAT-42-recipe-scaling`)
- `fix/` – bug fixes (e.g. `fix/PLAT-57-pantry-merge-units`)
- `docs/` – documentation only
- `test/` – tests only
- `config/` – build, CI, or tooling configuration
- `misc/` – anything else

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <imperative summary>` in lower case, where the type is one of `feat`, `fix`, `docs`, `test`, `style`, `refactor`, `config`, or `misc`.

- `feat: add serving-size scaling to recipes`
- `fix: reject pantry quantities in incompatible units`
- `test: add unit tests for recipe controller`
- `style: run prettier on frontend components`

### Issues and Pull Requests

1. A PR should be associated with a specific Jira task or GitHub issue from our project plan.
2. The GitHub Actions CI pipeline (`format`, `lint`, `test`, `build`) must pass before merging.
3. At least one other team member must approve the PR before it is merged.
4. Bugs, demo feedback, and interface-testing findings should be filed as GitHub Issues with a label (`bug`, `feature`, `docs`, `test`).

---

## 2. Formatting

Formatting is fully automated. Run `npm run format` before every commit; CI rejects unformatted code.

| Rule                | Convention                                                                        | Enforced by               |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| Indentation         | 2 spaces, no tabs                                                                 | Prettier, `.editorconfig` |
| Line length         | 100 characters                                                                    | Prettier                  |
| Quotes              | Single quotes in TypeScript                                                       | Prettier                  |
| Semicolons          | Always                                                                            | Prettier                  |
| Trailing commas     | Everywhere they are valid (multi-line)                                            | Prettier                  |
| Line endings        | LF, final newline, no trailing whitespace                                         | `.editorconfig`           |
| **Brace placement** | Opening brace on the **same line** as the declaration or statement (K&R / "1TBS") | Prettier                  |
| **Braces required** | Always use braces for `if`/`else`/`for`/`while` bodies, even single statements    | _(review)_                |

```ts
// Correct
if (!recipe) {
  throw new NotFoundException(`Recipe ${recipeId} not found.`);
}

// Incorrect: missing braces
if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found.`);
```

---

## 3. Naming Conventions

| Element                           | Convention                                                                     | Example                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Classes, interfaces, enums, types | PascalCase, nouns                                                              | `GroceryList`, `RecipeSnapshot`, `Unit`                                      |
| Abstract base classes             | PascalCase, no `Abstract` prefix                                               | `Repository`, `BaseEntity`                                                   |
| Interfaces                        | No `I` prefix                                                                  | `NutritionInfo`, not `INutritionInfo`                                        |
| Enum members                      | PascalCase                                                                     | `Unit.Tablespoon`, `RecipeVisibility.Public`                                 |
| Methods and functions             | camelCase, verbs                                                               | `findVisibleTo()`, `addItem()`                                               |
| Boolean members                   | `is`/`has`/`can` prefix                                                        | `isOwnedBy()`, `hasSaved()`, `canAddQuantity()`                              |
| Variables, properties, parameters | camelCase                                                                      | `ownerId`, `servings`                                                        |
| Module-level constants            | UPPER_SNAKE_CASE                                                               | `USER_ID_HEADER`, `API_PREFIX`                                               |
| Files                             | kebab-case + role suffix                                                       | `recipe.entity.ts`, `in-memory-recipe.repository.ts`, `create-recipe.dto.ts` |
| Test files                        | Same name as the file under test + `.spec.ts`                                  | `recipe.entity.spec.ts`                                                      |
| DTO classes                       | `<Action><Thing>Dto`                                                           | `CreateRecipeDto`, `UpdatePantryItemDto`                                     |
| Repository classes                | `<Entity>Repository` (abstract), `InMemory<Entity>Repository` (implementation) | `RecipeRepository`                                                           |
| Angular components                | PascalCase class, `app-` kebab-case selector                                   | `GroceryListPage` / `app-grocery-list-page`                                  |

---

## 4. Documentation Conventions

We use [TSDoc](https://tsdoc.org/) (`/** ... */`) comments.

- **Every exported class** has a TSDoc comment that states its responsibility in one or two sentences. These comments are the basis for our CRC cards.
- **Public methods** get a TSDoc comment when the name alone does not explain the behaviour, side effects, or thrown errors (e.g. merging rules, "returns false if not found"). Do not restate the method name.
- **Inline comments** explain _why_, not _what_.
- **Design patterns** are annotated on the participating class with a `@pattern` tag naming the pattern and the class's role. Every pattern in [`DESIGN.md`](DESIGN.md#design-patterns) must have at least one annotation in the source:

  ```ts
  /**
   * Root of every domain entity: gives each one an identity and timestamps.
   *
   * @pattern Template Method — `toJSON()` is the template method; subclasses
   *   implement the `snapshot()` primitive operation.
   */
  export abstract class BaseEntity<TSnapshot extends object> { ... }
  ```

- **Temporary code** is marked `TEMPORARY:` with what will replace it. Unfinished work is marked `TODO(<name>):`.
- When you add, rename, or remove a domain class, service, or repository, update [`DESIGN.md`](DESIGN.md) in the same PR.

---

## 5. TypeScript & Object-Oriented Design

Write strictly typed, object-oriented code. `strict` mode is on.

- **No `any`.** Define an `interface`, `type`, or `class` instead; use `unknown` when a type is truly unknown (ESLint error).
- **Explicit access modifiers.** Mark every class member `public`, `protected`, or `private`. Mark fields `readonly` unless they must change.
- **Encapsulate state.** Entity state is `private`; expose it with getters and change it only through methods that validate the change. Never return a mutable internal collection. Return a copy or a `readonly` array.
- **Value objects are immutable.** Operations on `Quantity` (and future value objects) return new instances.
- **Depend on abstractions.** Services depend on abstract classes (e.g. `RecipeRepository`), which double as Nest DI tokens. TypeScript interfaces do not exist at run time and cannot be injected.
- **Dependency Injection.** Do not instantiate services or repositories with `new` inside another class. Inject them through the constructor. (Creating entities and value objects with `new` is expected.)
- **Prefer composition** over deep inheritance. Our inheritance hierarchies (`BaseEntity -> OwnedEntity -> Recipe`) stay at most three levels deep.
- **Single responsibility.** If a class's TSDoc summary needs the word "and" for unrelated jobs, split it _(review)_.

---

## 6. Backend Standards (NestJS)

Each feature folder contains `<feature>.module.ts`, `.controller.ts`, `.service.ts`, plus `entities/`, `dto/`, `repositories/`, and optionally `testing/` for test fixtures.

- **Controllers are for routing.** Read the request (params, body, `@CurrentUserId()`), call one service method, and return its result. No business logic, and no direct repository access.
- **Services coordinate.** Load entities through the repository, call entity methods, save, and throw Nest HTTP exceptions (`NotFoundException`, `ForbiddenException`) for "missing" or "not allowed".
- **Entities own the business rules.** Validation and invariants live in entity constructors and methods. They use the helpers in `common/domain/guards.ts` and throw `DomainValidationError` (mapped to HTTP 400 by `DomainErrorFilter`). Entities and value objects never import `@nestjs/*`.
- **DTOs** are plain classes describing request bodies (`CreateRecipeDto`). They carry no logic; services convert them into domain objects.
- **Privacy.** Another user's private resource is reported as **404 Not Found**, not 403, so its existence is not revealed. Use 403 only when the resource is visible but the action is not allowed (e.g. editing someone else's public recipe).
- **Cross-feature access** goes through the other feature's exported service, never its repository.

---

## 7. Frontend Standards (Angular)

- **Standalone components** with signals for component state (`signal`, `computed`).
- **Small components.** Keep each component focused on one UI element. Split it when the template or class grows unwieldy _(review)_.
- **No direct DOM manipulation.** Do not use `document.getElementById()` and similar calls. Use template binding and the built-in control flow (`@if`, `@for`).
- **Service layer.** Components never call `fetch()` or `XMLHttpRequest`. They inject a feature service (e.g. `GroceryListsService`) that uses `HttpClient`. API URLs start with `/api`, which the dev server proxies to the backend.
- **Cross-cutting HTTP concerns** (auth header, error handling) belong in HTTP interceptors under `app/core/`, not in each service.
- Use `protected` for members used only by the template, and `private` for everything else that is not part of the public API.

---

## 8. Testing

- Every class with logic has a `.spec.ts` next to it. New public methods need tests, including at least one negative case (invalid input, not found, or not allowed).
- **Test names** describe behaviour: `it('findOne treats another user’s private recipe as not found')`.
- **Backend:** entity specs construct entities directly. Service specs use `Test.createTestingModule` with the in-memory repository. Controller specs replace the service with a `jest.fn()` mock (`{ provide: Service, useValue: mock }`).
- **Frontend:** component specs mock services with `vi.fn()` via `TestBed` providers. HTTP service specs use `HttpTestingController`.
- **Fixtures:** build test data with builder functions that accept overrides (e.g. `buildCreateRecipeDto({ title: 'X' })`), kept in the feature's `testing/` folder or a `*.fixtures.ts` file.
- If your change breaks an existing test, fix the code or update the test before opening the PR.
