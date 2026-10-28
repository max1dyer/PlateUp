# Third-Party Notices

PlateUp is built with the open-source components and external services listed below. We use each one under the terms of its license. We have not modified their source code. Full license texts are in each package's `LICENSE` file under `node_modules/`, and the Angular production build writes the frontend's runtime licenses to `frontend/dist/frontend/3rdpartylicenses.txt`.

When you add a runtime dependency or external service, add it here.

## Runtime components

| Component                                | Used for                                 | License    | Source                                       |
| ---------------------------------------- | ---------------------------------------- | ---------- | -------------------------------------------- |
| NestJS (`@nestjs/*`)                     | Backend framework, DI container, testing | MIT        | https://github.com/nestjs/nest               |
| Express (via `@nestjs/platform-express`) | HTTP server                              | MIT        | https://github.com/expressjs/express         |
| Angular (`@angular/*`)                   | Frontend framework                       | MIT        | https://github.com/angular/angular           |
| RxJS                                     | Reactive streams (Angular HTTP, events)  | Apache-2.0 | https://github.com/ReactiveX/rxjs            |
| reflect-metadata                         | Decorator metadata for NestJS DI         | Apache-2.0 | https://github.com/rbuckton/reflect-metadata |
| tslib                                    | TypeScript runtime helpers               | 0BSD       | https://github.com/microsoft/tslib           |

## Development tools

| Tool                                    | Used for              | License    |
| --------------------------------------- | --------------------- | ---------- |
| TypeScript                              | Language and compiler | Apache-2.0 |
| Jest, ts-jest                           | Backend unit tests    | MIT        |
| Vitest, jsdom                           | Frontend unit tests   | MIT        |
| ESLint, `@typescript-eslint/*`          | Linting               | MIT        |
| Prettier, eslint-config-prettier        | Formatting            | MIT        |
| Nest CLI, Angular CLI, `@angular/build` | Build tools           | MIT        |

## External services (planned for Beta)

The application must comply with each provider's terms of service and display the required attribution (Supplemental Spec 3.6).

| Service               | Used for                               | Attribution / terms                                |
| --------------------- | -------------------------------------- | -------------------------------------------------- |
| Supabase              | Authentication and PostgreSQL database | **TODO:** link terms of service                    |
| Kroger API            | Ingredient retail prices               | **TODO:** required attribution text                |
| USDA FoodData Central | Ingredient nutrition data              | Public domain (CC0). Cite "USDA FoodData Central". |
| API Ninjas            | Starter recipe data                    | **TODO:** required attribution text                |
