# Design and Architecture

This is the team's living design reference. It is the source for the Interim **Design Approach** paragraph, the **CRC cards**, the **static class diagram**, and the **sequence diagrams**. Keep it in sync with the code: when a domain class, service, or repository is added, renamed, or removed, update this file in the same PR.

---

## Architecture overview

PlateUp has three tiers ([`sprint4.md` Part 4](sprint4.md)):

- an **Angular** single-page app in the browser
- a **NestJS** application server exposing a REST API
- a database (planned: Supabase/PostgreSQL; currently in-memory), plus external services (Supabase Auth, Kroger, USDA FoodData Central, API Ninjas)

The backend is organized into **feature modules** (`users`, `recipes`, `pantry`, `grocery-lists`) that share building blocks in `common/`. Every request passes through the same four layers:

```mermaid
flowchart LR
  Client["Angular service<br/>(HttpClient)"] -->|HTTP /api/...| C[Controller]
  C -->|DTO + userId| S[Service]
  S -->|abstract API| R[(Abstract Repository)]
  R -. implemented by .-> IM[InMemory Repository]
  S -->|calls methods on| E[Entity / Value Object]
  E -->|throws| DVE[DomainValidationError]
  DVE -->|caught by| F[DomainErrorFilter → HTTP 400]
```

| Layer          | Responsibility                                                                   | Must not                                     |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| Controller     | Map an HTTP route to one service call; identify the user with `@CurrentUserId()` | Contain business logic or touch repositories |
| Service        | Coordinate a use case: load, call entity methods, save; enforce ownership        | Re-implement rules that belong to an entity  |
| Repository     | Store and query aggregates behind an abstract class                              | Contain business rules                       |
| Entity / Value | Hold state privately and enforce every invariant                                 | Depend on NestJS or HTTP                     |

---

## SOLID

| Principle                 | How we apply it                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Controllers route, services coordinate, repositories store, and entities enforce rules. `DomainErrorFilter` only translates errors. `Quantity` only does unit arithmetic.                                         |
| **O**pen/Closed           | A database is added by writing a new `Repository` subclass, without modifying services. New entities reuse `BaseEntity.toJSON()` by implementing `snapshot()`. Planned import parsers are new classes, not edits. |
| **L**iskov Substitution   | Any `RecipeRepository` implementation (in-memory, database, or test fake) can replace another without the service noticing. Every `OwnedEntity` can be ownership-checked the same way.                            |
| **I**nterface Segregation | Each feature repository adds only the queries its service needs (`findVisibleTo`, `findByOwner`, `findByUsername`) on top of a minimal four-method base.                                                          |
| **D**ependency Inversion  | Services depend on abstract repository classes, and modules bind the concrete class (`{ provide: RecipeRepository, useClass: InMemoryRecipeRepository }`).                                                        |

---

## Design patterns

Every pattern listed here is annotated in the source with a `@pattern` TSDoc tag ([`CODING_STANDARDS.md` 4](CODING_STANDARDS.md#4-documentation-conventions)).

### Implemented

| Pattern                     | Participants                                                                                                                 | Why we use it                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Injection**    | Every service and controller constructor. Module `providers` bind abstract repository tokens to implementations.             | Decouples consumers from concrete classes. This lets us swap in-memory storage for a database, and lets tests substitute fakes and mocks. |
| **Template Method**         | `BaseEntity.toJSON()` (template method) calls the abstract `snapshot()` (primitive operation), which each entity implements. | Every entity serializes with identical id and timestamp handling while keeping its fields private.                                        |
| **Mock Objects**            | Controller specs (`jest.fn()` services), frontend component specs (`vi.fn()` services), `HttpTestingController`.             | Tests one class in isolation, without HTTP, storage, or other features.                                                                   |
| **Adapter**                 | `DomainErrorFilter` adapts `DomainValidationError` (domain) to an HTTP 400 response (Nest/Express).                          | Keeps the domain layer framework-free.                                                                                                    |
| **Singleton**               | Nest providers (default singleton scope); Angular services with `providedIn: 'root'`.                                        | One shared repository instance per app, so all services see the same data.                                                                |
| **Chain of Responsibility** | Angular HTTP interceptors (`userIdInterceptor`, on the `mxbwilly` branch); Nest's exception-filter chain.                    | Cross-cutting request handling without modifying each service.                                                                            |

Other techniques (not on the course list): **Repository**, **Value Object** (`Quantity`, `RecipeIngredient`), and **Aggregate Root** (`GroceryList` owns its `GroceryListItem`s).

### Planned (Beta)

| Pattern                           | Feature                                                                                                                                | Notes                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategy**                      | Grocery-list generation: "add all ingredients" vs. "add only what the pantry is missing" (user setting); recipe sorting and filtering. | A `GroceryGenerationStrategy` interface with one class per policy, chosen at run time from user preferences.                                                  |
| **Factory Method** + **Strategy** | Social-media import (TikTok, Instagram, YouTube Shorts).                                                                               | Spec 3.5 requires that a new platform needs only one new parser module. Use a `RecipeTextParser` interface and a factory that picks the parser for a source. |
| **Observer**                      | Household shared grocery list (live updates within 2 s).                                                                               | WebSocket gateway publishes list changes. The Angular client subscribes through an RxJS `Observable`.                                                         |
| **Facade** + **Proxy**            | External API clients (Kroger, USDA, API Ninjas).                                                                                       | A facade gives one interface over all external calls. A caching proxy handles caching and the shared 15-second timeout.                                       |
| **Null Object**                   | Missing price or nutrition data.                                                                                                       | Lets calculations continue and label figures as unavailable (Reliability 3.3).                                                                               |

---

## Class inventory

These are the major classes for CRC cards and the class diagram. Paths are relative to `backend/src/`.

| Class                                                                                                      | Kind                  | Path                                       |
| ---------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------ |
| `BaseEntity<T>`                                                                                            | abstract entity       | `common/domain/base.entity.ts`             |
| `OwnedEntity<T>`                                                                                           | abstract entity       | `common/domain/owned.entity.ts`            |
| `Quantity`                                                                                                 | value object          | `common/domain/quantity.ts`                |
| `DomainValidationError`                                                                                    | error                 | `common/errors/domain-validation.error.ts` |
| `DomainErrorFilter`                                                                                        | exception filter      | `common/filters/domain-error.filter.ts`    |
| `Repository<T>` / `InMemoryRepository<T>`                                                                  | persistence           | `common/persistence/`                      |
| `User`, `UsersService`, `UsersController`, `UserRepository`                                                | users feature         | `users/`                                   |
| `Recipe`, `RecipeIngredient`, `RecipesService`, `RecipesController`, `RecipeRepository`                    | recipes feature       | `recipes/`                                 |
| `PantryItem`, `PantryService`, `PantryController`, `PantryItemRepository`                                  | pantry feature        | `pantry/`                                  |
| `GroceryList`, `GroceryListItem`, `GroceryListsService`, `GroceryListsController`, `GroceryListRepository` | grocery-lists feature | `grocery-lists/`                           |

### Domain class diagram (draft)

This draft is generated from the source. Refine it into the final UML class diagram (for example in draw.io or StarUML) before the Interim deadline.

```mermaid
classDiagram
  direction TB
  class BaseEntity~T~ {
    <<abstract>>
    +id: string
    +createdAt: Date
    +updatedAt: Date
    +toJSON() EntityJson & T
    #touch() void
    #snapshot()* T
  }
  class OwnedEntity~T~ {
    <<abstract>>
    +ownerId: string
    +isOwnedBy(userId) boolean
  }
  class User {
    +username: string
    -profile: UserProfile
    -savedRecipes: Set~string~
    +updateProfile(changes) void
    +saveRecipe(recipeId) void
    +unsaveRecipe(recipeId) void
    +hasSaved(recipeId) boolean
  }
  class Recipe {
    -details: RecipeDetails
    +update(changes) void
    +isVisibleTo(userId) boolean
    +ingredientsFor(servings) RecipeIngredient[]
  }
  class RecipeIngredient {
    +name: string
    +quantity: Quantity
    +scale(factor) RecipeIngredient
  }
  class PantryItem {
    -itemName: string
    -itemQuantity: Quantity
    +rename(name) void
    +setQuantity(quantity) void
  }
  class GroceryList {
    -listName: string
    -itemsById: Map~string, GroceryListItem~
    +rename(name) void
    +addItem(name, quantity) GroceryListItem
    +updateItem(itemId, changes) boolean
    +removeItem(itemId) boolean
  }
  class GroceryListItem {
    +name: string
    +quantity: Quantity
    -isPurchased: boolean
    +setPurchased(purchased) void
  }
  class Quantity {
    <<value object>>
    +amount: number
    +unit: Unit
    +scale(factor) Quantity
    +equals(other) boolean
  }

  BaseEntity <|-- OwnedEntity
  BaseEntity <|-- User
  BaseEntity <|-- GroceryListItem
  OwnedEntity <|-- Recipe
  OwnedEntity <|-- PantryItem
  OwnedEntity <|-- GroceryList
  Recipe "1" *-- "1..*" RecipeIngredient : ingredients
  GroceryList "1" *-- "0..*" GroceryListItem : items
  RecipeIngredient --> "1" Quantity
  PantryItem --> "1" Quantity
  GroceryListItem --> "0..1" Quantity
```

---

## Sequence diagram candidates

Candidates from the source code:

1. **UC6 Generate Grocery List** (Interim scope: one recipe at a chosen serving size). The flow is `GroceryListsController` → `GroceryListsService` → `RecipesService.findOne()` → `Recipe.ingredientsFor(servings)` → `RecipeIngredient.scale()` → `Quantity.scale()` → `GroceryList.addItem()` → `GroceryListRepository.save()`. **TODO:** the service endpoint that ties these together is not implemented yet. `Recipe.ingredientsFor()` exists.
2. **UC5 Add Ingredient to Pantry**, including merging an existing ingredient in a compatible unit (`PantryService.add` → `PantryItemRepository.findByOwner` → `PantryItem.canAddQuantity` → `Quantity.plus`; on the `mxbwilly` branch).
3. **UC3 Upload Recipe**, including the validation failure path (`Recipe` constructor → `requireText` throws `DomainValidationError` → `DomainErrorFilter` → 400).

---

## CRC cards

**TODO (Interim):** one card per class in the inventory above. Use a template with something like this?

```markdown
### <ClassName>

**Responsibilities**

- ...

**Collaborators**

| Collaborator | Coupling                                  | Justification |
| ------------ | ----------------------------------------- | ------------- |
| ...          | Data / Stamp / Control / Common / Content | ...           |

**Cohesion:** Functional / Sequential / Communicational / Procedural / Temporal / Logical / Coincidental. Justify in one sentence.
```
