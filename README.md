## PlateUp

Npm workspaces monorepo.

- clone: `git clone <url>`
- install: `npm install`
- run from root directory:
  1. [frontend](http://localhost:4200): `npm run start --workspace=frontend`
  2. [backend](http://localhost:3000): `npm run dev --workspace=backend`
  - The frontend calls the backend through `/api/...`, which the Angular dev server proxies to port 3000 (`frontend/proxy.conf.json`), so run both.
  - Data is in memory and resets on restart. On startup the backend adds three demo recipes by `demo-chef`.
  - Open <http://localhost:4200>, then **Create account** with any username, or **Log in** as `demo-chef`. Login takes only a username until Supabase authentication is added.
- test:
  - local formatting command: `npm run format`
  - Each of us will work on different branches and github actions CI will run these commands when creating a pull request.
  1. formatting: `npm run format:check`
  2. linter: `npm run lint`
  3. unit tests: `npm run test`
  4. compile for release: `npm run build`

---

NestJS backend and Angular frontend: TypeScript classes, decorators, dependency injection.

**Backend (`backend/src`)**

- Built with NestJS.
- Each feature will consist of a Module, Controller, and Service.
- Files:
  - `main.ts`: server entry point.
  - `*.module.ts`: config file that wires your classes together.
  - `*.controller.ts`: API routing layer (only receives HTTP requests (GET, POST) and returns responses).
    - Calls the service code.
  - `*.service.ts`: Business logic, where the actual Object-Oriented work happens (database calls, math, data manipulation).
  - `*.spec.ts`: Jest unit testing for the file next to it.
  - `entities/`: domain classes that own their data and rules (e.g. `Recipe`, `GroceryList`).
  - `dto/`: request body classes (e.g. `CreateRecipeDto`).
  - `repositories/`: an abstract repository (the DI token services depend on) plus its in-memory implementation.

Current feature modules: `users`, `recipes`, `pantry`, `grocery-lists`, `contact`. Shared building blocks live in `common/`, and `seed/` loads demo data on startup.

```
backend/src/
  main.ts, app.module.ts      entry point and root module
  common/                     shared base classes, value objects, guards, errors, persistence
  <feature>/
    <feature>.module.ts       wires the controller, service, and repository binding
    <feature>.controller.ts   HTTP routes
    <feature>.service.ts      use cases
    entities/                 domain classes and their rules
    dto/                      request body shapes
    repositories/             abstract repository + in-memory implementation
    testing/                  test data builders (optional)
```

Design:

- Request flow: Controller → Service → Repository, with entities carrying the business rules.
- Every entity extends `BaseEntity` (id, timestamps, `toJSON()`); user-owned ones extend `OwnedEntity` (`ownerId`, `isOwnedBy()`).
- `Quantity` is an immutable value object shared by recipes, the pantry, and grocery lists (`scale()` handles serving sizes).
- Entities throw `DomainValidationError` for invalid input, which `DomainErrorFilter` returns as HTTP 400.
- Storage is **in-memory** for now (data resets on restart). To add a database, write a new class that extends the feature's abstract repository and change `useClass` in that feature's module. No service code changes.
- Authentication is not implemented yet. Requests identify the user with an `x-user-id` header, read by the `@CurrentUserId()` decorator. Only that decorator needs to change when auth is added.

Adding new features:

- Makes a new `backend/src/recipes/` folder.

```
# NestJS will modify the AppModule and generate boilerplate code
npx nest generate module recipes
npx nest generate controller recipes
npx nest generate service recipes
```

**Frontend (`frontend/src`)**

- `app/`: the root `App` component, `app.routes.ts` (every page), and `app.config.ts` (app-wide providers).
  - `core/`: app-wide services, the HTTP interceptor, the route guard, and small helpers.
  - `layout/`: the header, footer, and toast messages shown on every page.
  - One folder per feature (`recipes/`, `pantry/`, `grocery-list/`, `preferences/`, `users/`, `contact/`, `home/`, `info/`), laid out the same way:

    ```
    recipes/
      recipes.service.ts        HTTP calls for the feature (components never call HTTP directly)
      recipe.models.ts          interfaces matching the backend's JSON
      recipe-filter.ts          plain helper functions, when the feature has any
      recipe.fixtures.ts        test data builders
      recipe-page/              one folder per component:
        recipe-page.ts            component class: state and event handlers
        recipe-page.html          template, reading from the class
        recipe-page.css           styles that apply only to this component
        recipe-page.spec.ts       Vitest unit test (run through `ng test`)
    ```

- `index.html`: single page, raw html file the server sends to the browser.
  - Angular injects the application into this.
- `main.ts`: frontend entry point, loads the Angular code into `index.html`.
- `styles.css`: global stylesheet.

New encapsulated components for UI pieces can be made inside a feature folder with: `npx ng generate component recipes/recipe-card`

- Makes a new `src/app/recipes/recipe-card/` folder holding the component's `.ts`, `.html`, `.css`, and `.spec.ts`.
