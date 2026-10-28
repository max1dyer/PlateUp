# Interface Mockup, User Stories, Supplemental Specification, Use Cases, Work Breakdown Structure, Project Schedule

---

# **Part 1\. Product Interface Mockup**

The interface mockup is our baseline demonstration of the intended functionality and UI usage of the web application. Built in Figma, the prototype view supports a clickable model to walk through a sample use-case of the application, showing various screens with their specific controls, and how a user is able to navigate between screens.

Our walkthrough explores the site's main pages including homepage, about, contact, recipe feed (prior to logging in), user homepage, user profile, recipe feed (with logged-in functionality), a sample recipe, grocery list, pantry inventory, saved recipes, and planner. Our user pages are the most detailed and include essential information reflected in our user stories.

The recipe page features a search bar with sorting/filtering; we have a sample functionality walkthrough for sorting a recipe by rating. The recipe page has a default trending section and new recipe section. We created a sample recipe: Thai Red Curry. Our recipe includes basic information of the recipe including a thumbnail, a description, an option to save the recipe, the user who created it, date created, rating, time to complete, number of ingredients, macro information, dietary tags, and cuisine tags. The recipe also includes a detailed ingredients list which shows which ingredients the user is missing, and gives an option to add those ingredients to their grocery list. Additionally, the recipe includes the steps to complete it, option to add the recipe to the planner, user reviews, and the ability to add a new review. These select features address user stories 2.2, 2.6, 2.7, 2.12, 2.18, and 2.21.

The planner includes meal planning and calorie tracking. Our walkthrough shows example functionality of a user adding a meal to their planner, choosing the day, time, recipe, and number of servings. This reflects user story 2.3. The pantry includes a listing of ingredients the user has, their expiration dates, and an ability to add ingredients into your pantry (user story 2.1). Our walkthrough shows an example of adding ingredients a user is missing from a recipe to their grocery list.

Because the mockup is built in Figma, this section provides a clear visual record of the design that we intend to follow during the implementation phase.

# **Part 2\. User Stories**

## **2.1 Pantry Inventory**

As a parent, I want an easy way to keep track of all my pantry inventory so that I can see what recipes I can make with what I already have.

Story Points: 2

Discussion Notes:

- Users should be able to maintain a list of ingredients currently in their pantry, with a quantity and unit size.
- Users should be able to add ingredients either by selecting a known ingredient or by creating a new one when none match.
- Pantry contents should influence recipe discovery (ranking by how well the items in the pantry match the requirements of the meal), and grocery-list generation (subtracting items that are already owned).
- The pantry should work with both personal (private) and public recipes.
- Adding and removing ingredients must require as few interactions as possible, since this is a frequent operation.

Acceptance Tests:

- Add a known/saved ingredient with a quantity and verify that it appears in the pantry with the correct unit.
- Add an ingredient absent from the catalogue and verify that it is created, listed, and offered in later selections.
- Test removing an ingredient from the pantry and verify that it no longer appears, even after reloading the application.
- Test viewing the current pantry inventory, ensuring that each quantity is accurate.
- Test that pantry inventory affects recipe/grocery-list recommendations by perfectly matching an existing recipe and verifying that it appears high on the list of recommended meals.
- Verify that pantry matching is computed for both private and public recipes.

## **2.2 Upload and Share Recipes**

As a chef, I want to upload my own recipes to a common place so people in my team can know the steps they need to follow and ingredients they need.

Story Points: 3

Discussion Notes:

- Every recipe must contain a title, an ingredient list, and an ordered preparation of steps; a thumbnail, total time, and macro details are optional additions to the recipe.
- Recipes may be set to private or public. Private recipes are visible only to their author and to users with whom the author has explicitly shared them.
- Users should be able to share recipes with other users.
- Open question: whether a recipient should receive a notification when a recipe is shared with them.
- Open question: whether a user should be able to opt out of receiving shared recipes.

Acceptance Tests:

- Upload a recipe with a title, ingredients, and steps and verify that it is stored and displayed.
- Attempt to upload a recipe lacking ingredients or steps and verify that the submission is rejected with a useful and specific error message.
- Share a recipe with another user and ensure the recipient can view it.
- Set a recipe to private and verify that it disappears from the feed and search results of other users.
- Set a private recipe to public and verify that other users can find and view it.
- Request a private recipe directly as an unauthorized user and verify that access is denied.

## **2.3 Weekly Meal Planner**

As a chef, I want to add my meals to a week planner so I know exactly what I am going to make this week.

Story Points: 2

Discussion Notes:

- Each user should have a planner organized by the days of the week (configurable start day).
- Recipes should be added to particular days in the planner, with an assigned serving size at that time.
- Planned meals should persist between sessions and form the input for grocery-list generation.

Acceptance Tests:

- Add a recipe to a chosen day and verify that it appears under that day.
- Open a particular day and verify that only the meals planned for that day are shown.
- Remove a planned meal and check it is removed from the planner.
- Leave and return to the planner (and log out and back in) and verify that planned meals remain.
- Add a meal with a custom serving size and verify that the planner stores and displays that size.

## **2.4 Preferred Serving Size and Budget**

As a food caterer, I want to be able to set my preferred quantity of food and budget so that I can efficiently serve at parties or funerals.

Story Points: 1

Discussion Notes:

- Users may store a preferred serving size, which is applied by default when a recipe is viewed or added to the planner.
- Ingredient quantities are scaled automatically and proportionally whenever the serving size changes.
- Users should also be able to store a preferred food budget, which can constrain recipe sorting and selection.
- Budget information may also interact with ingredient prices and grocery lists.

Acceptance Tests:

- Set a preferred serving size and verify that it is saved to the user’s preferences.
- Add a recipe to the planner without specifying a size and verify that the preferred serving size is applied.
- Change the serving size from 4 to 8 and verify that every ingredient quantity doubles.
- Override the serving size manually for a single recipe and verify that the preference itself is unchanged.
- Set a preferred budget, log out and back in, and verify that the value persists.
- Sort recipes by price with a budget set and verify that recipes above the budget are excluded or clearly marked.

## **2.5 Ingredient Pricing**

As a food caterer, I want to be able to add a price to my ingredients so I know how much I will be spending on groceries.

Story Points: ½

Discussion Notes:

- Users can assign prices to ingredients.
- Individual prices should be stored per user, because the same ingredient costs different amounts for different shoppers
- Stored prices feed the grocery list totals, the pantry valuation, and price-based sorting.
- Where a user has not set a price, the application falls back to a retail pricing service.

Acceptance Tests:

- Assign a price to an ingredient and verify that it is displayed with its unit.
- Edit an existing price and verify that dependent totals are recalculated.
- Log out and back in and verify that the price persists.
- Generate a grocery list and verify that its total equals the sum of quantity × unit price for each item.
- Sort recipes by price and verify that the order reflects the user’s stored prices.

## **2.6 Add Ingredients from Recipe**

As a busy businessman, I want ingredients from recipes to be added to my grocery list so I don’t have to take the time to add them myself.

Story Points: 3

Discussion Notes:

- A grocery list may be generated from a single recipe at a chosen quantity or from all recipes in the weekly planner
- Ingredients already in the user's pantry should be subtracted from the grocery list.
- Users should be able to manually edit the generated list, including quantities and individual items.
- The team discussed warning users when they may have an ingredient but do not have enough for all planned recipes.

Acceptance Tests:

- Generate a list from one recipe at four servings and verify that quantities match the scaled recipe.
- Plan three recipes sharing an ingredient and verify that the generated list merges them into a single combined quantity.
- Stock the pantry with part of an ingredient and verify that only the remaining quantity is listed.
- Verify that the shortfall is computed correctly when the pantry quantity is lower than the combined requirement.
- Manually add and remove a grocery item and verify that the list updates accordingly.
- Change the quantity of a listed item and verify that the new value is stored.

## **2.7 Recipe Tags and Filtering**

When my meetings run longer than anticipated, I want some easy comfort meal so I can satisfy my cravings and get rid of stress.

Story Points: 2

Discussion Notes:

- Recipes can have descriptive tags such as:
  - Comfort food
  - Healthy
  - Italian
  - Indian
  - Chinese
  - American
- Users filter the feed by one or more tags. Mood tags and cuisine tags may be combined with each other and with other filters.

Acceptance Tests:

- Assign a tag to a recipe and verify that it is saved and displayed on the recipe.
- Filter by the single tag "Comfort Food" and verify that every result carries that tag.
- Filter by two tags (e.g., Italian and Comfort Food) and verify that only recipes satisfying both are returned.
- Verify that recipes without the selected tag are not displayed.

## **2.8 Healthy and Budget-Friendly Meals**

As an athlete, I want to browse healthy meal recipes so that I can stay in shape and reach my goals while staying within my budget.

Story Points: 2

Discussion Notes:

- Users should be able to filter/sort recipes based on nutritional information.
- Recipes should include macro information.
- Macro values can be calculated by the app for recipes missing macro information.
- Meal prices should be calculated by the app.
  - Use set ingredient prices and an API for ingredients not manually set.
- Users should be able to filter/sort recipes based on price.

Acceptance Tests:

- Filter by a calorie range and verify that every result falls within it.
- Filter by any macronutrient range and check results against stored values.
- Sort recipes by price and verify ascending and descending order.
- Open a recipe lacking macro data and verify that the application calculates and displays calories and macros marked as estimates.
- Combine a calorie ceiling with a price ceiling and verify that all results satisfy both constraints.

## **2.9 Set Calorie Goals**

As an athlete, I want to be able to set my preferred daily macro split and my preferred calories per meal so that I can gain weight.

Story Points: 2

Discussion Notes:

- Users should be able to set personal calorie and macro goals, together with a preferred calorie figure per meal.
- Planned meals could be compared against these goals, providing a daily consumption summary.

Acceptance Tests:

- Set a daily calorie goal and check it is stored.
- Set a macronutrient split and verify that it is rejected if the percentages do not total 100\.
- Set a calories-per-meal value and verify that it is stored.
- Log out and back in and verify that all goals persist.
- Plan several meals for a day and verify that their combined calories and macros are compared against the stored goals.

## **2.10 Recipe Difficulty**

As a student, I want to browse meals that are easy to make so I don’t waste my energy making food that comes out terrible.

Story Points: 1

Discussion Notes:

- Recipe difficulty could be determined by the number of steps.
- Users should be able to sort recipes by difficulty.
- Difficulty sorting is included in the supplemental specification.

Acceptance Tests:

- Sort by difficulty and verify that recipes are ordered from easiest to hardest.
- Compute the difficulty of the same recipe repeatedly and verify that the result is always identical.
- Compare a three-step recipe with a fifteen-step recipe and verify that the shorter recipe is classified as easier.

## **2.11 Quick Meals**

As a student, I want to browse meals that do not take a lot of time to make so I have more time to study.

Story Points: 1

Discussion Notes:

- Recipes should include total preparation and cooking time.
- Users should be able to sort the feed by total time, shortest first.

Acceptance Tests:

- Sort by time and verify that recipes are listed from shortest to longest.
- Verify that recipes with equal times retain a stable, predictable order.
- Verify that the displayed time matches the stored value, including in the recipe detail view.

## **2.12 Save Favorite Recipes**

As a student, I want to find recipes and save my favorites for later so I can have a running list of recipes I like to choose from for planning my meals.

Story Points: 1

Discussion Notes:

- Users should have a saved recipes section that holds each user's favorites.
- Users should be able to access saved recipes from the main navigation.
- Users should be able to "heart" or save a recipe to add it to their list of favorites.
- Folders or collections could be added later for more organization.

Acceptance Tests:

- Select the heart option on a recipe and verify that it appears in the saved list.
- Select the heart option again and verify that the recipe is removed.
- Open the saved-recipes section from any screen and verify that all saved recipes are present.
- Attempt to exceed the saved-recipe limit and verify that the user receives an explanatory message.

## **2.13 Trending Recipes**

As an influencer, I want to browse trending recipes so I can stay current with food trends.

Story Points: 2

Discussion Notes:

- Trending recipes can be determined using:
  - Ratings
  - Number of views
  - Recent uploads
- Users should be able to search by meal name or ingredient.

Acceptance Tests:

- Test sorting recipes by rating.
- Test sorting recipes by popularity/trending status and verify that the order follows the trending scores.
- Sort by upload date and verify that the newest recipes appear first.
- Search by meal name and verify that matching recipes are returned.
- Search by ingredient name and verify that every result contains the ingredient.

## **2.14 Import Social Media Recipes**

As an influencer, I want to upload recipes from TikTok so I can recreate them for myself.

Story Points: 3

Discussion Notes:

- Users should be able to copy and paste recipe information from social media.
- The team discussed using a parser/AI agent to extract recipe information; the approach remains to be decided.
- Importing from TikTok, Instagram, and YouTube.
- Imported information could include:
  - Ingredients
  - Steps
  - Time
  - Calories
  - Other recipe information
- All auto-populated fields remain editable before the recipe is saved.

Acceptance Tests:

- Paste a TikTok caption containing a recipe and verify that a draft recipe is produced.
- Verify that the ingredients in a labelled sample set are extracted with the agreed accuracy.
- Verify that the steps are extracted in their original order.
- Verify that time and calories are extracted when present and left blank when absent.
- Manually correct an imported ingredient and verify that the corrected value is saved.
- Test importing recipes from supported social media platforms.

## **2.15 Roommate Sharing**

As a roommate, I want to share a digital household grocery list so that my roommates and I can track what we need to buy and avoid buying the same ingredients.

Story Points: 5

Discussion Notes:

- Multiple accounts should be able to access the same household grocery list.
- Changes made by one user should be visible to other household members.
- Open question: how duplicate ingredients added by two members should be handled.
- Open question: whether changes should appear live or on the next refresh (the architecture reserves a WebSocket channel for live updates).

Acceptance Tests:

- Assign two accounts to one household and verify that both see the same list.
- Edit the list from one account and verify that the change appears for the other.
- Add the same ingredient from two accounts and verify that the entries are merged according to the agreed rule.
- Verify that two simultaneous additions do not create a duplicate purchase entry.
- Mark an item as purchased and verify that the status is reflected for every member.

## **2.16 Account Registration and Login**

As a new user, I want to create an account and log in so that my recipes, pantry, planner, and preferences are stored privately for me and persist across devices.

Story Points: 2

Discussion Notes:

- Authentication must be delegated to the Supabase identity service, so that the application never stores passwords.
- Every personal feature (saving, planning, grocery list) requires an authenticated session.
- Open question: should unauthenticated visitors be allowed to browse public recipes?

Acceptance Tests:

- Register with a valid email and password and verify that an account and an authenticated session are created.
- Register with an email already in use and verify that a clear message is shown and no second account exists.
- Log in with valid credentials and verify that the user’s own data is displayed.
- Log in with an incorrect password and verify that access is denied without revealing which field was wrong.
- Request a protected resource without a session and verify that access is refused.

## **2.17 Public Profile**

As a home cook, I want to set a display name, a short biography, and profile picture on my account so that other users can recognize me as the author of my recipes.

Story Points: 1

Discussion Notes:

- The display name and bio are shown wherever the user's recipes are attributed.
- Profile pictures are restricted by file type and size.

Acceptance Tests:

- Change the display name and verify that it appears on the user’s recipes.
- Enter a bio exceeding the maximum length and verify that the entry is rejected.
- Upload a valid profile picture and verify that it is displayed.
- Upload an unsupported or oversized file and verify that it is rejected with an explanation.

## **2.18 Rate and Review Recipes**

As a home cook who is familiar with characteristics of a great recipe, I want to be able to rate and review other recipes so that others can judge their quality and so that good recipes rise in the shared public feed.

Story Points: 2

Discussion Notes:

- A review should consist of a rating of some undetermined scale and an optional written comment.
- Each user may review a recipe once but may later edit the review; authors cannot review their own recipes.
- Average ratings should contribute to the trending score.

Acceptance Tests:

- Submit a four-star review (or 9/10, or the decided scale) and verify that the recipe’s average rating is recalculated.
- Submit a second review for the same recipe and verify that it replaces rather than duplicates the first.
- Attempt to review one’s own recipe and verify that the action is refused.
- Submit a rating outside the decided range and verify that it is rejected.

## **2.19 Edit and Delete My Recipes**

As a chef, I want to be able to edit or delete the recipes I have uploaded so that I can make improvements that I learn over time and so that my collection stays accurate and current.

Story Points: 2

Discussion Notes:

- Only the author should be able to edit or delete a recipe.
- Deletion should require confirmation before removing it from the feeds, saved lists, and planners.
- Open question: should there be a history of changes, or a version number to track how many iterations a recipe has gone through to be perfected?

Acceptance Tests:

- Edit an ingredient quantity and verify that the updated recipe is shown in every view.
- View a recipe from another account and verify that you are not able to modify their recipe without copying it.
- Delete a recipe, confirm the prompt, and verify that it no longer appears in search or in saved lists.
- Cancel the deletion prompt and verify that the recipe is unchanged.

## **2.20 Create My Own Version of a Recipe**

As a parent, I want to create my own version of an existing recipe so that I can easily adapt it to my family's tastes and dietary preferences.

Story Points: 2

Discussion Notes:

- Copying from another user should create a private version on your account that is editable.
- A copied recipe should retain a form of recognition of the original owner's profile, in the recipe description.
- After modifying the copied recipe, the changes should not be reflected in the original user's recipe.

Acceptance Tests:

- Create a version of a public recipe and verify that an independent private copy appears in the user’s recipes.
- Modify the copy and verify that the original is unchanged.
- Verify that the copy displays attribution to the original author.

## **2.21 Dietary Restrictions**

As a parent, I want to record my family’s dietary restrictions so that I only see recipes that are safe for us to eat.

Story Points: 2

Discussion Notes:

- Restrictions (for example vegetarian, vegan, gluten-free, dairy-free, nut-free) should be stored in preferences and applied automatically to every feed and search.
- Users should also be able to apply restrictions manually as a filter.
- Because restrictions may relate to allergies, results must be labelled as informational rather than medical guidance.
  - There should be a form of flag, symbol, or disclaimer on a recipe to make it clear that the recipe contains commonly restricted foods.

Acceptance Tests:

- Select "nut-free" in preferences and verify that no recipe containing nuts is displayed.
- Clear all restrictions and verify that previously hidden recipes reappear.
- Apply a dietary filter manually and verify that results satisfy it.
- Verify that the disclaimer is shown beside dietary filters on a given recipe.

## **2.22 Follow Other Users**

As an influencer, I want to follow other users so that I can easily find the recipes that they publish.

Story Points: 1

Discussion Notes:

- Following should be a one-directional operation and should not require approval.
- Users will deliberately be unable to private message or make blog-style posts.

Acceptance Tests:

- Follow a user and verify that the user appears in the following list.
- Verify that the followed user's public recipes can be listed from one page.
- Unfollow the user and verify that the user's entries are removed.

# **Part 3\. Supplemental Specifications**

The following specifications organize the project's requirements using the FURPS+ model: functionality, usability, reliability, performance, supportability, and other design, implementation, and legal constraints. The functional requirements were derived from the user stores and the use cases, while the remaining categories were derived from the architecture and deployment plans, and from the quality we expect from the product.

Each section will assign priority to each testable statement using the MoSCoW scheme. In this document, Must is referring to an essential component to the Interim or Beta release, Should is referring to important and planned tasks for the beta release (but the product remains usable without it), Could represents the desirable tasks that are purely supplemental to the core features, and Won't describes the features that are explicitly excluded from the project's scope.

Each statement will be specific and measurable, while the precise form of testing that is required may vary, whether it must be done through automated or manual testing, demonstration to a user, or other methods of verification.

## **3.1 Functionality**

### **3.1.1 Recipe Discovery**

| Requirement                                                                                                                                                        | Verification |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| The system **must** present a recipe feed of recipe cards, each showing a thumbnail, title, author, average rating, total time, and a macro summary.               | Tests        |
| The system **must** search recipes by title and by ingredient name using case-insensitive partial matching and return only recipes visible to the requesting user. | Tests        |
| The system **must** sort recipes by popularity/trending, average rating, number of ingredients, and total time, in ascending or descending order.                  | Tests        |
| The system **must** filter recipes by dietary restriction, supporting at least vegetarian, vegan, gluten-free, dairy-free, and nut-free.                           | Tests        |
| The system **must** apply any combination of selected filters together with one sort criterion, returning only recipes that satisfy every selected filter.         | Tests        |
| The system **should** filter recipes by cuisine tag (for example American, Chinese, Indian, Italian).                                                              | Tests        |
| The system **should** filter recipes by mood tag (for example comfort, healthy).                                                                                   | Tests        |
| The system **should** sort recipes by pantry match, defined as the proportion of a recipe’s ingredients present in the user’s pantry.                              | Tests        |
| The system **should** assign each recipe a difficulty level using a single documented rule based on its number of steps and should allow sorting by that level.    | Tests        |
| The system **should** sort and filter recipes by calories and by each macronutrient (fat, carbohydrate, protein).                                                  | Tests        |
| The system **should** sort recipes by estimated price and exclude or flag recipes exceeding the user’s preferred budget.                                           | Tests        |

###

### **3.1.2 Recipe Management**

| Requirement                                                                                                                                                                                                                                                             | Verification |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| The system **must** allow a user to create a recipe manually and reject a submission lacking a title, at least one ingredient, or at least one step.                                                                                                                    | Tests        |
| Every recipe **must** store a title, the uploading user, an ingredient list (name, quantity, unit), ordered steps, and an average rating.                                                                                                                               | Inspection   |
| A recipe **should** optionally store a thumbnail image, total time to complete, and macronutrient details.                                                                                                                                                              | Inspection   |
| The system **must** create a draft recipe from text pasted from a TikTok, Instagram, or YouTube post, extracting title, ingredients, steps, and (when present) time and calories; on a labelled test set, at least 80% of ingredient lines must be extracted correctly. | Tests        |
| The system **must** allow the user to edit every auto-populated field of a recipe before it is saved.                                                                                                                                                                   | Tests        |
| The system **must** allow an author to edit their own recipes after upload and must refuse edits by any other user.                                                                                                                                                     | Tests        |
| The system **must** allow an author to delete their own recipes after explicit confirmation and must remove deleted recipes from feeds, search results, saved lists, and planners.                                                                                      | Tests        |
| The system **must** allow a user to create an independent, private copy of any recipe they may view, retaining a link to the original recipe and its author.                                                                                                            | Tests        |
| The system **must** allow an author to set each of their recipes to private or public; a private recipe must be visible only to its author and to users it has been shared with.                                                                                        | Tests        |
| The system **should** allow an author to share a recipe with a specific registered user.                                                                                                                                                                                | Tests        |
| The system **must** allow a user to rate a recipe from 1 to 5 stars with an optional comment, limited to one editable review per user per recipe, and must update the recipe’s average rating.                                                                          | Tests        |
| The system **must** allow a user to add recipes to, and remove them from, a personal saved list.                                                                                                                                                                        | Tests        |
| The system **must** scale every ingredient quantity by the ratio of the chosen servings to the recipe’s base servings, rounded to at most two decimal places.                                                                                                           | Tests        |
| The system **should** calculate calories and macronutrients for recipes that lack them using ingredient nutrition data.                                                                                                                                                 | Tests        |
| The system **should** estimate recipe cost using user-defined ingredient prices and, for ingredients without one, retail price data from an external pricing service.                                                                                                   | Tests        |

###

### **3.1.3 Planning, Pantry, and Grocery List**

| Requirement                                                                                                                                                                                              | Verification  |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| The system **should** provide a weekly planner to which a recipe can be added for a specific day with a chosen serving size, viewed per day, and removed; planned meals should persist between sessions. | Tests         |
| The system **must** generate a grocery list for one recipe at a user-specified number of servings.                                                                                                       | Tests         |
| The system **should** generate a grocery list from all meals in a selected week of the planner, merging identical ingredients with compatible units into a single entry.                                 | Tests         |
| The system **must** allow users to add, remove, and change the quantity of grocery-list items manually, including items that were generated automatically.                                               | Tests         |
| The system **should** allow users to maintain a pantry by adding and removing ingredients with quantities and units.                                                                                     | Tests         |
| When generating a grocery list the system **should** subtract pantry quantities and list only the remaining shortfall for each ingredient.                                                               | Tests         |
| The system **should** allow a user to assign, edit, and remove a price for each ingredient, stored per user.                                                                                             | Tests         |
| The system **should** allow a user to store daily calorie and macronutrient goals and a calories-per-meal preference, rejecting macro splits that do not total 100%.                                     | Tests         |
| The system **could** compare planned meals against the user’s goals and display a daily calorie and macro summary.                                                                                       | Demonstration |

###

### **3.1.4 Accounts, Profile, and Preferences**

| Requirement                                                                                                                                                                     | Verification |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------- |
| The system **must** allow visitors to register an account and registered users to log in and out.                                                                               | Tests        |
| The system **must** allow a user to set a display name and a biography within defined length limits.                                                                            | Tests        |
| The system **should** allow a user to upload a profile picture.                                                                                                                 | Tests        |
| The system **must** allow a user to store preferences for default recipe sorting, default serving size, and dietary restrictions, applying them automatically in every session. | Tests        |
| The system **should** allow a user to store a preferred food budget.                                                                                                            | Tests        |
| The system **could** allow a user to follow other users and to list the public recipes of followed users.                                                                       | Tests        |

###

### **3.1.5 Collaboration, Extended Features, and Exclusions**

| Requirement                                                                                                               | Verification  |
| :------------------------------------------------------------------------------------------------------------------------ | :------------ |
| The system **could** allow several accounts to join a household and share a single grocery list.                          | Tests         |
| The system **could** propagate a change to a household grocery list to all connected household members within 2 seconds.  | Tests         |
| The system **could** allow household members to share a pantry and a weekly planner.                                      | Tests         |
| The system **could** allow users to add ingredients to the pantry by scanning a product barcode.                          | Demonstration |
| The system **could** integrate the Stripe payment service to provide subscription tiers that determine user capabilities. | Demonstration |
| The system **won't** provide private messaging between users.                                                             | Inspection    |
| The system **won't** provide blog-style or micro-blog posting.                                                            | Inspection    |

###

### **3.1.6 Security**

| Requirement                                                                                                                                                                              | Verification |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| The system **must** delegate credential storage and verification to the Supabase identity service and must not store passwords.                                                          | Inspection   |
| All communication between client and server **must** use TLS 1.2 or higher (HTTPS and WSS).                                                                                              | Inspection   |
| The server **must** enforce authorization on every request so that a user can read or modify only their own private data; unauthorized requests will return an HTTP 401 or 403 response. | Tests        |
| The system **must** validate and sanitise all user-supplied text and files to prevent script injection and SQL injection.                                                                | Tests        |
| The system **should** limit repeated failed login attempts, temporarily blocking an account or address after five consecutive failures.                                                  | Tests        |

## **3.2 Usability**

| Requirement                                                                                                                                                                                                            | Source | Verification  |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :------------ |
| The application **must** use a single design theme (colour, typography, spacing, and component styles) defined in one shared design system.                                                                            | UI     | Inspection    |
| Every button and navigation tab **must** carry a text label that states its function; in usability testing, at least 90% of participants must identify the purpose of each primary navigation item without assistance. | UI     | Tests         |
| New accounts **must** start with documented defaults suited to the target user: a default serving size of \~2 (to be decided), trending as the default sort, and no dietary filter pre-selected.                       | UI     | Inspection    |
| Each primary task **must** be done along a predictable path: saving a recipe in at most 2 interactions from the feed, and generating a grocery list from a recipe in at most 4\.                                       | UI     | Tests         |
| From every authenticated screen the user **must** reach the recipe feed, saved recipes, pantry, grocery list, planner, and profile with a single interaction from the banner.                                          | UI     | Tests         |
| The user **must** be able to edit manually any field or list that the system has populated automatically.                                                                                                              | UI     | Tests         |
| Every list and data view **should** provide distinct empty, loading, and error states with a message describing the condition and the next action.                                                                     | UI     | Demonstration |
| The system **should** confirm each completed user action (for example save, delete, add to list) with visible feedback within 1 second.                                                                                | UI     | Demonstration |

## **3.3 Reliability**

| Requirement                                                                                                                                                                                     | Verification |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| The system **must** persist every user-created item (recipes, pantry, planner, grocery list, preferences) to the database so that no data is lost after logout, page reload, or server restart. | Tests        |
| After a recipe is edited, every subsequent view of that recipe **should** display the updated content within 5 seconds.                                                                         | Tests        |
| Scaled and aggregated grocery quantities **must** be correct in 100% of the cases in the team’s test suite.                                                                                     | Tests        |
| When an external service (pricing, nutrition, recipe data) is unavailable, core features **should** continue to operate and the user should be told which figures are missing.                  | Tests        |
| The deployed application **should** achieve at least 99% availability over each month of beta evaluation.                                                                                       | Analysis     |
| The database **should** be backed up automatically every 24 hours, with backups retained for at least 7 days.                                                                                   | Tests        |
| Concurrent edits to a household grocery list **could** be resolved without loss of either member’s change; duplicate ingredients could be merged into one entry.                                | Tests        |

## **3.4 Performance**

| Requirement                                                                                                                                                                                                                                                             | Verification |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| A social-media import **should** return an editable draft within 10 seconds for a single pasted post. Measuring completion time after the call to our API to parse the media text.                                                                                      | Tests        |
| The system **must** limit each user to 500 saved recipes and inform the user when the limit is reached.                                                                                                                                                                 | Tests        |
| The system **should** limit each user to 200 uploaded recipes and inform the user when the limit is reached.                                                                                                                                                            | Tests        |
| The system **must** reject any recipe image upload exceeding 5MB and return a descriptive error message. Achieved with an integration test attempting to post a 5.1MB dummy file, asserting that the system returns an HTTP 413 (Payload too large) or HTTP 400 status. | Tests        |
| The system **must** abort any external API operation if the server fails to respond within 15 seconds, and notify the user of the timeout. Tested with a mocking library to intercept the external call and force a 16-second delay.External API timeout handling       | Tests        |

## **3.5 Supportability**

| Requirement                                                                                                                                                                                                                         | Verification  |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| The application **must** display correctly and remain fully usable on desktop viewports (width 1024 px and above) and mobile viewports (width 360 px and above).                                                                    | Tests         |
| The application **must** function on current releases of Google Chrome (154.0.8037.57), Mozilla Firefox (157.0.1), and Microsoft Edge (154.0.4258.62).                                                                              | Tests         |
| The import component **should** be structured so that support for an additional source platform requires adding one parser module without modifying other modules.                                                                  | Inspection    |
| The application **could** provide offline access to previously loaded saved recipes and the current grocery list.                                                                                                                   | Demonstration |
| The project **won't** deliver a native mobile application.                                                                                                                                                                          | Tests         |
| Every push or pull request to the main and develop branches **must** trigger an automated pipeline that installs dependencies, lints, checks formatting, runs tests, and builds both workspaces; a failing step will block merging. | Tests         |
| Automated unit tests **should** cover at least 70% of statements in both the frontend and backend workspaces.                                                                                                                       | Analysis      |

## **3.6 Legal Constraints**

| Requirement                                                                                                                                                                  | Verification |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| Imported recipes **must** retain a link to their source post, and users must accept terms of use confirming that they hold the right to share content they upload or import. | Inspection   |
| The application **must** comply with the terms of service of Supabase, Kroger, API Ninjas, and USDA FoodData Central, including any required attribution.                    | Inspection   |
| On request, the system **should** delete a user’s account and personal data within 30 days.                                                                                  | Tests        |
| Calculated nutrition, price figures, and dietary filters **must** be labelled as estimates and must carry a notice that they are not medical or allergy advice.              | Inspection   |
| The import feature **must** process only text supplied by the user and not scrape social-media platforms automatically.                                                      | Inspection   |

# **Part 4\. Deployment Diagram**

The following UML diagram shows the hardware and software structure on which the application will be deployed. The solution follows a three-tiered system: a web-browser client, an application server that hosts the business logic, and a database server, supplemented by four third-party services that the server calls. Each node represents a machine; execution environments and artifacts are nested inside the nodes that host them, and each communication path is labelled with its protocol.

Regarding what is included within the client's web browser: the Angular application bundle executes within the clients web browser by downloading the pre-compiled Angular Javascript code to render the user interface and call the server, whereas the application server's role is strictly to serve these static assets and the REST API.

![][image1]

# **Part 5\. Use Cases**

This section lists the use cases for the project, in the fully dressed format. Each use case records its identifier, name, description, actors, pre-conditions, a numbered sequence of actions, alternative flows, and post-conditions; special requirements, variations, open issues/questions are included where they apply.

Every sequence begins with an action by the primary actor and then alternates between what the actor does and what the actor sees, without reference to any particular interface. Where the System answers with a message, the wording of the message is given in quotation marks, and text in square brackets stands for a value that the System fills in. Processing that the actor never sees (searching, filtering, calculating, storing) is not listed as a step; its visible result is described instead.

**Actors**

- Visitor: a person without an account or session.
- User: a registered, authenticated person. Author is a User who owns a recipe, and Recipient is a User with whom a recipe is shared.
- System: the web application, comprising the client and the server. Pantry, Planner, and Grocery List name the stores that the System keeps for each User.
- Identity Service (Supabase), Nutrition Service (USDA FoodData Central), and Pricing Service (Kroger API) are all external systems with which the System communicates.
- Scheduler: the time event that starts UC15.

### UC1: Plan Weekly Meals

| Use Case: MealPlanner |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**        | UC1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Description**       | A User assigns recipes to the meals of a day so that the whole week's cooking is organized in advance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Actors**            | **Primary:** User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**    | User is authenticated. At least one recipe is available to the User (own, saved, shared, or public).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Flow of events**    | User asks to plan meals for a week. System presents the seven days of the week. Under each day it lists the four meals (Breakfast, Lunch, Snacks, Dinner), each showing its planned recipe and number of servings, or "Nothing planned". User chooses a meal on a day. System asks which recipe is wanted and invites the User to give a recipe name or an ingredient. User provides a recipe name or an ingredient. System presents the recipes that match and that the User may view. Each recipe shows its title, author, time to complete, and calories per serving. User chooses a recipe. System asks for the number of servings, suggesting the User’s preferred serving size. User provides the number of servings. System states "\[Recipe title\] is planned for \[Day\], \[Meal\] (\[n\] servings)." and presents the updated week as in step 2\.                                                                                                                                                                                               |
| **Alternative Flow**  | 3a. User asks to remove a planned meal: System asks "Remove \[recipe title\] from \[Day\], \[Meal\]?" User confirms. System states "Meal removed." and presents the updated week. If the User declines, nothing changes. 3b. User asks to move a planned meal to another day or meal: User names the new day and meal. System states "\[Recipe title\] moved to \[Day\], \[Meal\]." and presents the updated week. 6a. No recipe matches the search: System states "No recipes match ‘\[search text\]’. Try a different recipe name or ingredient." The sequence resumes at step 5\. 9a. User gives no number of servings: System uses the User’s preferred serving size and the sequence continues at step 10\. 9b. The number is not a whole number of 1 or more: System states "Servings must be a whole number of 1 or more." The sequence resumes at step 9\. 10a. The chosen recipe was deleted or made private after step 6: System states "This recipe is no longer available, so it was not added to your plan." The sequence resumes at step 5\. |
| **Post-conditions**   | Planner holds the recipe for the chosen day and meal time with its servings. The plan persists between sessions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Open Issues**       | Whether several recipes may share one meal time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### UC2: Browse Recipe Feed

| Use Case: BrowseRecipeFeed |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**             | UC2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Description**            | A User explores recipes presented in a feed ordered according to their preferences.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Actors**                 | **Primary:** User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Pre-conditions**         | User must be authenticated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Flow of events**         | User asks to browse recipes, leaving the default sorting and fiiltering preferences. System presents a feed of the recipes (public recipes, the User’s own, and those shared with the User), in the User’s default order (trending, until the User chooses another). Recipes that conflict with the User’s selected dietary restrictions,or allergies are not shown. Each recipe shows a photo, title, author, average rating, time to complete, and calories and macronutrients per serving. User chooses a recipe. System presents the full recipe (UC18). |
| **Alternative flow**       | 2a. No recipe is available: System states "There are no recipes to show right now. Try removing a dietary restriction or disliked ingredient in your preferences, or search for a specific recipe." and offers to open the preferences (UC10) or to search (UC17). 3a. User asks for further recipes: System presents the next group in the same order and states "Showing \[shown\] of \[total\] recipes." 3b. User asks to narrow or reorder the recipes by text, filter, or sort criterion: The sequence continues in UC17.                               |
| **Post-conditions**        | No stored data changes except the recipe’s view count, which contributes to the trending score.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Frequency**              | Very high; at the start of most sessions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### UC3: Upload Recipe

| Use Case: UploadRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**         | UC3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Description**        | A User creates a new recipe by providing its details, so that it is stored and can be cooked, planned, and shared.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Actors**             | **Primary:** User, **Secondary:** Nutrition Service                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pre-conditions**     | User is authenticated. User has not reached the limit for uploaded recipes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Flow of events**     | User asks to add a new recipe. System asks for the recipe’s title. User provides the title. System asks for the ingredients, each with a name, quantity, and unit. User provides the ingredients. System asks for the preparation steps, in order. User provides the steps. System asks for the time needed to complete the recipe. User provides the time. System asks for optional details: a photo, a description, tags, calories and macronutrients per serving, and whether the recipe is private or public (private if the User does not choose). User provides any of the optional details and chooses private or public. System presents a summary for review: title, photo, ingredients, steps, time, difficulty, visibility, and calories and macronutrients per serving (the User’s figures, or an estimate labelled "Estimated" when the User gave none). User confirms. System states "Your recipe ‘\[title\]’ has been added as \[private/public\]." and presents it among the User’s recipes.                             |
| **Alternative Flow**   | 1a. The upload limit has been reached: System states "You have reached the maximum number of uploaded recipes. Delete one of your recipes to add a new one." and offers to show the User’s recipes (UC21). The use case ends. 3a, 5a, 7a, 9a. User gives nothing for a required item: System states, respectively, "A title is required.", "At least one ingredient is required.", "At least one step is required.", or "A time to complete is required." and asks for that item again. 11a. The photo is of an unsupported type or too large: System states "This photo could not be used because its file type is not supported or it is too large. You can continue without a photo." The sequence continues at step 12\. 12a. The Nutrition Service is unavailable and the User gave no figures: System states "Nutrition figures could not be estimated right now. They will be added to your recipe when they are available." The recipe is stored with its figures pending. 13a. User abandons the recipe: System stores nothing. |
| **Post-conditions**    | A new recipe exists in the database, owned by the User, with the information provided and the chosen visibility. Macros are stored, or marked as pending.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### UC4: Track Daily Macros

| Use Case: DailyTrackedMacros |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**               | UC4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Description**              | A User reviews the calories and macronutrients consumed on a day against personal targets and records what was eaten.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Actors**                   | **Primary:** User. **Secondary:** Nutrition Service.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Pre-conditions**           | User is authenticated. User has ingredients and preset volumes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Flow of events**           | User asks to see the nutrition summary for a day (today, unless the User names another day). System presents the running totals of calories, protein, carbohydrates, and fat consumed that day, set beside the User’s daily targets if any are set (for example "Calories: 1,450 of 2,000"), and the meals planned for that day, each marked "Eaten" or "Not yet eaten" with its calories. User indicates that a planned meal was eaten. System marks the meal "Eaten" and presents the updated totals beside the targets, with the meal counted for the servings planned. |
| **Post-conditions**          | The day’s totals reflect every meal recorded as eaten and every food logged. Any changed targets are stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### UC5: Add Ingredient to Pantry

| Use Case: AddToInventory |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**           | UC5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Description**          | A User records an ingredient, with its quantity, as held in the Pantry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Actors**               | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Pre-conditions**       | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Flow of events**       | User asks to add an ingredient to the Pantry. System asks which ingredient is to be added. User provides the ingredient’s name. System presents the known ingredients whose names match. User chooses one of them. System asks for a quantity and unit, and for an expiration date if the User wishes to give one. User provides the quantity and unit, and optionally an expiration date. System states "\[Quantity\] \[unit\] of \[ingredient\] added to your Pantry. You now have \[total\]."                                                                                                                                                                                                                                                                                                                          |
| **Alternative Flow**     | 4a. No known ingredient matches: System states "No ingredient named ‘\[name\]’ was found. Create it as a custom ingredient?" User agrees and confirms the name. System states "Custom ingredient ‘\[name\]’ created." and the sequence resumes at step 6\. 7a. The quantity is not a positive number, or the date is not valid: System states "The quantity must be greater than zero." or "That is not a valid date." and the sequence resumes at step 6\. 8a. The Pantry already holds the ingredient in a different, compatible unit: System combines the amounts and states the total in the unit already held. 8b. The Pantry already holds the ingredient in an incompatible unit: System keeps a separate entry and states "Added as a separate entry because \[unit\] cannot be combined with \[existing unit\]." |
| **Post-conditions**      | The ingredient and quantity are in the User’s Pantry and persist between sessions. Any custom ingredient is available for later selection by the User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### UC6: Generate Grocery List

| Use Case: GenerateGroceryList |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**                | UC6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Description**               | A User obtains a list of the ingredients that must be bought to cook a recipe, or the meals planned for a week, after allowing for what the Pantry already holds.                                                                                                                                                                                                                                                                                                                                    |
| **Actors**                    | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**            | User is authenticated. User has chosen a recipe or has at least one meal planned.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Flow of events**            | User asks for a grocery list. System asks whether the list is for one recipe or for the meals planned in a week. User chooses a recipe and the number of servings, or chooses a week. System adds the items still to be bought to the Grocery List and states "\[n\] items added to your Grocery List." It presents the new items, each with its quantity and unit after allowing for the Pantry, and separately lists the ingredients already covered by the Pantry under "Already in your Pantry". |
| **Post- conditions**          | The Grocery List contains the shortfall items for the chosen recipe or week. The Pantry is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                |

### UC7: Analyze Recipe Nutrition Cost

| Use Case: RecipeMacros |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**         | UC7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Description**        | A User examines the estimated calories, macronutrients, and cost of a recipe at a chosen number of servings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Actors**             | **Primary:** User. **Secondary:** Nutrition Service, Pricing Service.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Pre-conditions**     | User is authenticated. User may view the recipe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Flow of events**     | User asks to see the nutrition and cost of a recipe. System asks for the number of servings, suggesting the User’s preferred serving size. User provides the number of servings. System presents, with every figure labelled "Estimate": calories, protein, carbohydrates, and fat, in total and per serving; the share of calories contributed by each macronutrient (for example "Protein 30%, Carbohydrates 45%, Fat 25%"); and the cost in total and per serving, with the cost of each ingredient marked "Your price" or "Store price".                                                                                                                                                                                                                                                                                                                                    |
| **Alternative Flow**   | 3a. The number of servings is not a positive number: System states "Servings must be a number greater than zero." and the sequence resumes at step 2\. 4a. The Author supplied nutrition figures: System presents them labelled "Provided by the author" and still estimates the cost. 4b. Some ingredients cannot be matched to a standard food: System presents the figures marked "Partial" and states "These ingredients are not included in the nutrition figures: \[list\]." 4c. The Nutrition Service is unavailable: System presents the cost alone and states "Nutrition figures are unavailable right now." 4d. The Pricing Service is unavailable and the User has set no price for some ingredients: System presents the remaining cost marked "Partial" and states "No price is available for: \[list\]. You can set your own price for these ingredients." (UC26) |
| **Post-conditions**    | Estimated nutrition and cost figures for the requested servings are available and stored for reuse. No other data changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### UC8: Add Recipe Ingredients to Pantry

| Use Case: AddToInventoryFromRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**                     | UC8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Description**                    | A User records in the Pantry all the ingredients that a recipe requires and that the Pantry does not yet hold.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Actors**                         | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Pre-conditions**                 | User is authenticated. At least one recipe is available to the User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Flow of events**                 | User asks to add the ingredients of a recipe to the Pantry. System asks for the recipe’s name and the number of servings. User provides the recipe name and number of servings. System presents the recipes whose names match and that the User may view, each with its title, author, and time to complete. User chooses a recipe. System presents the ingredients that the Pantry lacks or holds in insufficient amounts, each with the quantity needed for the stated servings. User confirms that all of them, or a chosen subset, are to be added. System states "\[n\] ingredients added to your Pantry." and presents their updated quantities. |
| **Alternative Flow**               | 4a. No recipe matches: System states "No recipe named ‘\[name\]’ was found." User gives another name (the sequence resumes at step 3\) or cancels. 6a. Nothing is missing: System states "Your Pantry already has everything needed for \[n\] servings of ‘\[title\]’. Nothing was added." 7a. User cancels: System states "No changes were made to your Pantry."                                                                                                                                                                                                                                                                                      |
| **Post-conditions**                | Pantry contains the confirmed quantities of the recipe’s missing ingredients.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### UC9: Authenticate User (Log In and Log Out)

| Use Case: AuthenticateUser |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**             | UC9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Description**            | A User proves their identity to begin a session in which personal data is available, and ends the session when finished.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Actors**                 | **Primary:** User. **Secondary:** Identity Service (Supabase).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**         | User holds a registered account. User is not logged in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Flow of events**         | User asks to log in. System asks for an email address and a password. User provides the email address and password. System states "Welcome back, \[display name\]." and presents the recipe feed (UC2) in the User’s preferred order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Alternative Flow**       | \*a. At any time after step 4, User asks to log out: System states "You have been logged out." The User’s personal data is no longer available until the User logs in again. 2a. User states that the password is forgotten and gives an email address: System states "If an account exists for \[email\], instructions to reset your password have been sent." User follows the instructions and provides a new password. System states "Your password has been changed. Please log in." and the sequence resumes at step 2\. 4a. The email address or password is not valid: System states "The email address or password is incorrect." (without saying which) and the sequence resumes at step 2\. 4b. Five consecutive failures have occurred: System states "Too many unsuccessful attempts. Please wait \[time\] before trying again." 4c. The Identity Service is unavailable: System states "Login is not available right now. Please try again later." |
| **Post-conditions**        | On success the User holds an active authenticated session. After log out no session exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Frequency**              | Once or more per session.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### UC10: Setting Dietary Preferences

| Use Case: DietaryPreferences |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**               | UC10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Description**              | A User records dietary restrictions, allergies, disliked ingredients, a default recipe sort, a preferred serving size, and a budget, so that the System personalises what it shows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Actors**                   | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Pre-conditions**           | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Flow of events**           | User asks to see their preferences. System presents the available restrictions (for example vegetarian, vegan, gluten-free, dairy-free, nut-free, halal, kosher), the User’s current selections, allergies, disliked ingredients, default sort, preferred serving size, and budget, or the documented defaults for a new User. User selects or deselects restrictions and provides any change to allergies, default sort (trending, newest, quickest, highest rated), preferred serving size, or budget. User confirms the changes. System states "Your preferences have been saved." From then on the recipe feed, recommendations, recipe warnings, and default servings reflect them. |
| **Alternative Flow**         | 3a. User identifies an ingredient to dislike: System finds matching known ingredients, and the chosen one is added to the disliked list. 3b. User removes an ingredient from the disliked list: System updates the list. 3c. User asks to clear all restrictions and dislikes: System asks for confirmation; after the User confirms, System removes them all, and otherwise changes nothing. 4a. User leaves without confirming: System discards the changes. 5a. A value is not valid: System identifies it, keeps the previous value, and the sequence resumes at step 3\.                                                                                                            |
| **Post-conditions**          | User’s preferences are stored Subsequent feed results, recommendations, recipe warnings, and serving defaults reflect them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### UC11: Manage Pantry Items

| Use Case: ManagePantryItems |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**              | UC11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Description**             | A User views, edits, and removes the ingredients held in the Pantry and controls when low or expiring items are flagged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Actors**                  | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**          | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Flow of events**          | User asks to see the Pantry. System presents each item with its name, quantity, unit, category, and expiration date if known. Items that are expired, expiring soon, or below their minimum quantity carry a marker saying so ("Expired", "Expires in \[n\] days", "Low"). User chooses an item and provides a new quantity, unit, expiration date, or category. System states "\[Item\] updated." and presents the revised Pantry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Alternative Flow**        | 2a. The Pantry is empty: System states "Your Pantry is empty. Add ingredients to see them here." and offers to add an ingredient (UC5). 3a. User asks to remove an item: System asks "Remove \[item\] from your Pantry?" If User confirms, System removes it and states "\[Item\] removed." Otherwise nothing changes. 3b. User indicates that an item is used up: System removes it and asks "\[Item\] removed. Add it to your Grocery List?" If User agrees, System states "\[Item\] added to your Grocery List." 3c. User provides search text, chooses a category or the "expiring soon" filter, or chooses to sort by name or by expiration date: System presents the matching items in the requested order, or states "No Pantry items match." 3d. User sets a minimum quantity for an item: System states "You will be reminded when you have less than \[quantity\] \[unit\] of \[item\]." Whenever the quantity later falls below the minimum, System asks "\[Item\] is running low. Add it to your Grocery List?" and adds it if the User agrees. 4a. A value is not valid: System states "The quantity cannot be negative.", "\[Unit\] cannot be used for \[item\].", or "That is not a valid date." and the sequence resumes at step 3\. |
| **Post-conditions**         | Pantry reflects the User’s edits and removals, and any minimum quantities are stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### UC12: Manage Grocery List

| Use Case: ManageGroceryList |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**              | UC12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Description**             | A User views and maintains the Grocery List, marks items as bought, and moves bought items into the Pantry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Actors**                  | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pre-conditions**          | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Flow of events**          | User asks to see the Grocery List. System presents the items grouped by category (for example produce, dairy, pantry staples), each with its quantity, unit, the recipe that needs it, and whether it is purchased, together with the estimated total cost of the items still to buy. User indicates that some items have been purchased. System shows those items as purchased and states how many items remain to buy. User asks that the purchased items be recorded in the Pantry. System asks for an expiration date for each purchased item, stating that giving one is optional. User provides the dates or declines. System states "\[n\] items moved to your Pantry." and presents the Grocery List without them.                                                                                                                                                                                                                                                                                                                              |
| **Alternative Flow**        | 2a. The list is empty: System states "Your Grocery List is empty. Generate a list from a recipe or a week’s plan, or add items yourself." 3a. User names an item and gives a quantity and unit to add: System states "\[Item\] added." If the item is already listed, System combines them and states the new quantity. 3b. User changes an item’s quantity or removes the item: System states the change and presents the updated list. 3c. User reverses the purchased mark on an item: System shows the item as not purchased. 3d. User asks to share the list by message, email, or print: System presents the list as plain text suited to that method, grouped by category, with each item’s quantity and unit. 5a. User asks to clear purchased items without recording them: System asks "Remove purchased items without adding them to your Pantry?" If User confirms, System removes them and states that the Pantry was not changed. 7a. A date is not valid: System states "That is not a valid date." and the sequence resumes at step 6\. |
| **Post-conditions**         | Purchased items that the User confirmed are in the Pantry and no longer on the list. All other edits are stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### UC13: Share Recipe

| Use Case: ShareRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**        | UC13                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Description**       | A User gives other people access to a recipe, either to a specific User, to anyone holding a link, or to all Users.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Actors**            | **Primary:** User. **Secondary:** Recipient (a User).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Pre-conditions**    | User is authenticated. The User owns the recipe, or the recipe is public and shareable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Flow of events**    | User asks to share a recipe. System asks with whom the recipe is to be shared: a specific User, anyone holding a link, or all Users. User chooses a specific User and gives their username or email address. System presents the User found (display name and username) and asks "Share ‘\[title\]’ with \[name\]?" User confirms. System states "‘\[Title\]’ has been shared with \[name\]." and notifies the Recipient with "\[Author\] shared ‘\[title\]’ with you." Recipient asks to see the notification. System presents the notification and the recipe among the recipes shared with the Recipient. |
| **Alternative Flow**  | \*a. At any time, User asks to remove a Recipient’s access or to return the recipe to private: System removes that access and confirms. 3a. User chooses all Users: System makes the recipe viewable by every User and confirms. 3b. User chooses a link: System provides a link that the User can copy and that grants view access to the recipe. 4a. The Recipient cannot be found: System informs the User and the sequence resumes at step 3\. 8a. Recipient asks to keep a copy: System adds a private copy, attributed to the original Author, to the Recipient’s recipes.                             |
| **Post-conditions**   | The chosen audience can view the recipe. The recipe’s sharing settings are stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### UC14: Cook Recipe

| Use Case: CookRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**       | UC14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Description**      | A User prepares a recipe, and when finished the System updates the Pantry and records the meal in the day’s macros.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Actors**           | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Pre-conditions**   | User is authenticated. The User may view the recipe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Flow of events**   | User asks to cook a recipe. System presents the recipe’s ingredients with the amount of each, marking each "In your Pantry" or "Short by \[amount\]", and asks for the number of servings. User provides the number of servings. System presents the ingredient amounts and the calories and macronutrients scaled to those servings. User asks to begin cooking. System presents the first step, showing its position ("Step 1 of \[total\]"). User indicates that the step is done. System presents the next step. This repeats until the last step is done. User indicates that the recipe is cooked. System states "Ingredients used have been taken from your Pantry and \[n\] servings added to today’s nutrition totals." and presents the updated Pantry quantities of the ingredients used.                                                           |
| **Alternative Flow** | 2a. Ingredients are missing from the Pantry: System lists them and asks "Add the missing ingredients to your Grocery List?" If User agrees, System states "Missing ingredients added to your Grocery List." If User declines, the User may continue anyway. The sequence continues at step 3\. 7a. User leaves before step 8: System states "Cooking ended. Your Pantry and nutrition totals were not changed." 8a. User states how many servings were eaten: System records only that portion in the day’s totals (UC4) and still takes all the ingredients used from the Pantry. 8b. User declines to record the meal in the day’s totals: System updates the Pantry only. 9a. The Pantry held less of an ingredient than was used: System sets it to zero and states "Your Pantry held less \[ingredient\] than the recipe used. Its quantity is now zero." |
| **Post-conditions**  | After step 8 the Pantry reflects the ingredients used and the servings eaten are in the day’s totals. If the User leaves early, nothing changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### UC15: Receive Expiration Alert

| Use Case: ReceiveExpirationAlert |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**                   | UC15                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Description**                  | The System notifies a User, at a scheduled daily time, of Pantry ingredients that have expired or are about to expire, and lets the User act on them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Actors**                       | **Primary**: Scheduler (time event). **Secondary**: User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pre-conditions**               | User has Pantry items with expiration dates. User has not disabled expiration alerts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Flow of events**               | Scheduler signals that the daily expiry-check time has arrived. System notifies the User with a summary such as "3 items in your Pantry have expired or expire within 3 days." (the window is 3 days unless the User has changed it). User asks to see the expiring items. System presents the Expiring Soon list, most urgent first, each item with its name, quantity, expiration date, and "Expired" or the number of days left. User chooses an item. System offers four actions for it: show recipes that use it, change its expiration date, mark it as used, or remove it. User chooses one of the actions and, where needed, provides the new date. System carries out the action and confirms, for example "\[Item\] marked as used." |
| **Alternative Flow**             | 2a. No item qualifies: System sends no notification. 3a. User dismisses the alert or postpones it: System states "Alert postponed until \[date and time\]." and sends nothing further until then. 3b. User changes the alert window or turns alerts off: System states "You will be alerted \[n\] days before items expire." or "Expiration alerts are turned off." 7a. User asks to see recipes that use the item: System presents them, each with its title, time to complete, and rating. User chooses one. System offers to add it to the Planner (UC1) or to present it (UC18).                                                                                                                                                           |
| **Post-conditions**              | The User has been informed of expiring items. Any postponement or alert setting is stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### UC16: Register Account

| Use Case: RegisterAccount |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**            | UC16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Description**           | A Visitor creates a personal account so that recipes, Pantry, Planner, and preferences can be stored privately.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Actors**                | **Primary**: Visitor (a person without an account). **Secondary**: Identity Service (Supabase).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pre-conditions**        | The Visitor has no existing account for the email address supplied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Flow of events**        | Visitor asks to create an account. System asks for a name, an email address, a password, and the password again for confirmation. Visitor provides the name, email address, password, and confirmation. System states "Your account has been created. Welcome, \[name\]\!" and starts the Visitor’s session as a User. System asks "Would you like to set your dietary preferences now?" User accepts and the sequence continues in UC10.                                                                                                                                                                                                                            |
| **Alternative Flow**      | 4a. Information is missing or malformed, or the passwords differ: System states each problem, for example "A name is required.", "Enter a valid email address.", or "The passwords do not match." The sequence resumes at step 2\. 4b. The email address is already registered: System states "An account already exists for this email address. Would you like to log in instead?" and offers UC9. 4c. The Identity Service is unavailable: System states "Registration is not available right now. No account was created. Please try again later." 6a. User declines to set preferences: System keeps the default preferences and presents the recipe feed (UC2). |
| **Post-conditions**       | A User account and profile with preferences (default or chosen) exist. The new User holds an authenticated session.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### UC17: Search, Filter, and Sort Recipes

| Use Case: SearchRecipes |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**          | UC17                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Description**         | A User narrows and orders the recipes available to them by text, tags, nutrition, price, and personal data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Actors**              | **Primary:** User. **Secondary:** Pricing Service and Nutrition Service (for estimated values).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**      | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Flow of events**      | User asks to search for recipes and provides text naming a meal or an ingredient. System presents the matching recipes that the User may view, stating how many were found. Each recipe shows a photo, title, author, average rating, time to complete, and calories per serving. User chooses filter criteria: dietary restriction, cuisine, mood, calorie or macronutrient range, price or budget ceiling, and time. System presents only the recipes that satisfy every chosen criterion, states the number found, and shows which criteria are in effect. User chooses a sort criterion: popularity, rating, number of ingredients, time, difficulty, calories or macronutrients, price, or Pantry match. System presents the results in that order, stating the sort in effect. User adjusts or clears any criterion. System presents the updated results as in steps 4 and 6\. User chooses a recipe and System presents it in full (UC18). |
| **Alternative Flow**    | 1a. User gives no search text: System treats every recipe that the User may view as a match. 4a. No recipe satisfies the criteria: System states "No recipes match all of your criteria. ‘\[Criterion\]’ excludes the most recipes. Try relaxing it." 6a. Sort by Pantry match: Each recipe shows "\[x\] of \[y\] ingredients in your Pantry" and the recipes with the most ingredients covered come first. 6b. Sort by price or filter by budget: Each recipe shows its estimated cost per serving, using the User’s own ingredient prices (UC26) and otherwise store prices (UC7). Recipes with no price are listed last, marked "Price unavailable". 6c. Nutrition or price figures cannot be obtained from a service: The affected recipes are listed last, marked "Nutrition unavailable" or "Price unavailable".                                                                                                                            |
| **Post-conditions**     | No stored data changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### UC18: View Recipe and Adjust Servings

| Use Case: ViewRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**       | UC18                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Description**      | A User examines a recipe in full and scales it to the number of servings they require.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Actors**           | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Pre-conditions**   | User is authenticated. The recipe is public, owned by the User, or shared with the User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Flow of events**   | User asks to view a recipe (for example one found in the feed, in search results, in the saved list, or in the Planner). System presents the recipe at the User’s preferred serving size: title, author, photo, time to complete, difficulty, ingredients with quantities, numbered steps, average rating with the number of reviews, the reviews themselves, estimated calories and macronutrients per serving, and estimated cost per serving. User provides a different number of servings. System shows every ingredient quantity in proportion to the new number of servings, updates the nutrition and cost figures to match, and states the number of servings shown. User may continue to another use case from the recipe: save (UC23), plan (UC1), generate a grocery list (UC6), cook (UC14), share (UC13), create a personal version (UC22), or review (UC24). The Author may also edit (UC20) or delete (UC21). |
| **Alternative Flow** | 2a. The User is not permitted to view the recipe: System states "This recipe is unavailable." 2b. Nutrition or cost figures cannot be obtained (UC7): System presents the recipe with "Nutrition unavailable" or "Cost unavailable" in their place. 3a. The number of servings is not a positive number: System states "Servings must be a number greater than zero." and keeps the previous value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Post-conditions**  | The recipe’s view count is incremented. Scaled quantities are not stored unless the User proceeds to another use case.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### UC19: Import Recipe from Social Media

| Use Case: ImportRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**         | UC19                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Description**        | A User turns recipe text copied from a social-media post into a stored recipe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Actors**             | **Primary:** User (as Author).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Pre-conditions**     | User is authenticated. User has copied recipe text from a TikTok, Instagram, or YouTube post.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Flow of events**     | User asks to import a recipe from a social-media post. System asks for the recipe text copied from the post and, optionally, the link to the post. User provides the text and, optionally, the link. System presents a draft recipe containing the title, ingredients (name, quantity, unit), steps, and the time and calories if the text gave them, naming the source platform when it is recognized. Each detail that is missing or uncertain is marked "Please check". User reviews the draft and corrects it. User confirms the import. System states "Your recipe ‘\[title\]’ has been imported from \[platform\]." and presents it with the source link as credit. |
| **Alternative Flow**   | 4a. The text contains no recognizable recipe: System states "No recipe could be found in this text. Check that you copied the ingredients and steps from the post." No draft is created. 4b. The analysis cannot be completed in time: System states "Importing took too long. You can enter the recipe yourself; your text has been kept." and offers manual entry (UC3) with the supplied text preserved. 6a. User abandons the draft: System stores nothing. 7a. The draft lacks a title, an ingredient, a step, or a time to complete: System states which items are missing, for example "A time to complete is required." The sequence resumes at step 5\.          |
| **Post-conditions**    | A recipe attributed to its source is stored, or no change is made.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### UC20: Edit Recipe

| Use Case: EditRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**       | UC20                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Description**      | An Author corrects or improves a recipe that they previously uploaded.                                                                                                                                                                                                                                                                                                                                                                                  |
| **Actors**           | **Primary:** User (as Author).                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**   | • User is authenticated and owns the recipe.                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Flow of events**   | User asks to edit one of their recipes. System presents the recipe’s current title, photo, description, tags, ingredients, steps, time to complete, nutrition figures, and visibility. User provides changes to any of these details. User confirms the changes. System states "‘\[Title\]’ has been updated." and presents the updated recipe, with difficulty, nutrition, and cost revised wherever the changes affect them. Existing reviews remain. |
| **Alternative Flow** | 3a. User abandons the edit: System keeps the original content. 4a. The result is not valid: System states what is missing or wrong, for example "A recipe needs at least one ingredient." The sequence resumes at step 3\.                                                                                                                                                                                                                              |
| **Post-conditions**  | The recipe reflects the changes; existing reviews are retained.                                                                                                                                                                                                                                                                                                                                                                                         |

### UC21: Delete Recipe

| Use Case: DeleteRecipe |                                                                                                                                                                                                                                                                                                                                                |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**         | UC21                                                                                                                                                                                                                                                                                                                                           |
| **Description**        | An Author permanently removes one of their recipes.                                                                                                                                                                                                                                                                                            |
| **Actors**             | **Primary:** User (as Author).                                                                                                                                                                                                                                                                                                                 |
| **Pre-conditions**     | User is authenticated and owns the recipe.                                                                                                                                                                                                                                                                                                     |
| **Flow of events**     | User asks to delete one of their recipes. System states "Deleting ‘\[title\]’ will remove it from all feeds, saved lists, and meal plans. This cannot be undone." and asks for confirmation. User confirms the deletion. System states "‘\[Title\]’ has been deleted." and the recipe no longer appears in any feed, saved list, or meal plan. |
| **Alternative Flow**   | 3a. User declines: System states "Nothing was deleted."                                                                                                                                                                                                                                                                                        |
| **Post-conditions**    | The recipe can no longer be retrieved by any User.                                                                                                                                                                                                                                                                                             |

### UC22: Create Personal Version of Recipe

| Use Case: CreatePersonalRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**                 | UC22                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Description**                | A User adapts an existing recipe by creating an independent copy that they may modify.                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Actors**                     | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Pre-conditions**             | User is authenticated. The User may view the original recipe.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Flow of events**             | User asks to create their own version of a recipe they are viewing. System states "A private copy of ‘\[title\]’ by \[Author\] has been added to your recipes." and presents the copy with its ingredients, steps, and other details, ready for changes. User provides changes to ingredients, steps, or other details. User confirms the changes. System states "Your version of ‘\[title\]’ has been saved." and presents it with the credit "Adapted from ‘\[original title\]’ by \[Author\]". |
| **Alternative Flow**           | 1a. The User may not view the original: System states "This recipe is unavailable." 3a. User leaves without making changes: The copy remains in the User’s recipes unchanged. 4a. The result is not valid: System states what is missing or wrong, for example "A recipe needs at least one step." The sequence resumes at step 3\.                                                                                                                                                               |
| **Post-conditions**            | A new recipe owned by the User exists; the original is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### UC23: Save Recipe

| Use Case: SaveRecipe |                                                                                                                                                                                                                                                                                                                                                                                                             |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**       | UC23                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Description**      | A User keeps a recipe in a personal list of favourites for later planning.                                                                                                                                                                                                                                                                                                                                  |
| **Actors**           | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**   | User is authenticated and may view the recipe.                                                                                                                                                                                                                                                                                                                                                              |
| **Flow of events**   | User asks to save a recipe. System states "‘\[Title\]’ has been saved to your favourites." User asks to see the saved recipes. System presents the saved recipes, each with a photo, title, author, average rating, and time to complete.                                                                                                                                                                   |
| **Alternative Flow** | 1a. The recipe is already saved: System removes it from the saved list and states "‘\[Title\]’ has been removed from your favourites." 2a. The limit for saved recipes has been reached: System states "You have reached the maximum number of saved recipes. Remove one to save this recipe." and offers to show the saved recipes. 4a. No recipe is saved: System states "You have no saved recipes yet." |
| **Post-conditions**  | The saved list reflects the addition or removal.                                                                                                                                                                                                                                                                                                                                                            |

### UC24: Review Recipe

| Use Case: ReviewRecipe |                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**         | UC24                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Description**        | A User rates a recipe and may add a comment to help other Users.                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Actors**             | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Pre-conditions**     | User is authenticated and may view the recipe. The User is not the Author of the recipe.                                                                                                                                                                                                                                                                                                                                                                                  |
| **Flow of events**     | User asks to review a recipe. System asks for a rating from 1 to 5 and an optional written comment. User provides the rating and, optionally, a comment. System states "Thank you. Your review has been posted." and presents the review together with the recipe’s updated average rating and number of reviews.                                                                                                                                                         |
| **Alternative Flow**   | 1a. The User has already reviewed the recipe: System asks "You have already reviewed this recipe. Replace your earlier review?" If User agrees, the sequence continues at step 2 and the new review replaces the earlier one. Otherwise nothing changes. 1b. The User is the Author: System states "You cannot review your own recipe." 3a. The rating is absent or outside the range: System states "Please give a rating from 1 to 5." The sequence resumes at step 2\. |
| **Post-conditions**    | The review is stored and the recipe’s average rating is current.                                                                                                                                                                                                                                                                                                                                                                                                          |

### UC25: Manage Profile

| Use Case: ManageProfile |                                                                                                                                                                                                                                                                                                                                             |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Identifier**          | UC25                                                                                                                                                                                                                                                                                                                                        |
| **Description**         | A User maintains the identity (display name, biography, picture) by which other Users recognise them.                                                                                                                                                                                                                                       |
| **Actors**              | **Primary:** User.                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**      | User is authenticated.                                                                                                                                                                                                                                                                                                                      |
| **Flow of events**      | User asks to see their profile. System presents the current display name, biography, picture, and the User’s public recipes. User provides a new display name, biography, or picture. System states "Your profile has been updated." and presents the updated identity, which other Users now see wherever the User’s recipes are credited. |
| **Alternative Flow**    | 3a. User removes the picture: System substitutes a default picture and states "Your picture has been removed." 4a. A value is not valid: System keeps the previous value and states the problem, for example "Your biography is too long." or "This picture’s file type or size is not supported." The sequence resumes at step 3\.         |
| **Post-conditions**     | The profile reflects the stored changes.                                                                                                                                                                                                                                                                                                    |

### UC26: Set Ingredient Price

| Use Case: SetPrice   |                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identifier**       | UC26                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Description**      | A User records what an ingredient costs them so that cost estimates reflect their own shopping.                                                                                                                                                                                                                                                                                                                                                           |
| **Actors**           | **Primary:** User.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Pre-conditions**   | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Flow of events**   | User asks to set the price of an ingredient. System asks which ingredient, and for the price together with the quantity and unit it applies to (for example "\$2.50 per 500 g"). User provides the ingredient, the price, and the quantity and unit. System states "Your price for \[ingredient\] is saved: \[price\] per \[quantity\] \[unit\]." and states that it will be used in recipe cost estimates, Grocery List totals, and price-based sorting. |
| **Alternative Flow** | 1a. The ingredient already has a User price and the User asks to change or remove it: System presents the current price. If User provides a new price, System states the change. If User removes it, System states "Store prices will be used for \[ingredient\]." 3a. The price or unit is not valid: System states "The price cannot be negative." or "\[Unit\] cannot be used for \[ingredient\]." The sequence resumes at step 2\.                    |
| **Post-conditions**  | The price is stored and affects only this User’s estimates.                                                                                                                                                                                                                                                                                                                                                                                               |

# **Part 6\. Work Breakdown Structure**

Each area is broken into work packages sized such that one team member can finish them in roughly 2-12 hours, and never through more than one sprint. Areas may be tagged with a target release: (I) Interim Release; (B) Beta Release; (C) "Could" stretch work from the Supplemental Specification. These tags **do not** define a committed schedule and only provide a general order of features that need to be implemented.

### **6.1 Project Management and Communication**

- Run the Wednesday 2:00 pm team meeting: review the sprint, assign next-sprint tasks, and record action items.
- Lead stand-up check-ins between meetings and log blockers in Jira.
- Convert each work package in this WBS into a Jira issue with an owner, story points, and target sprint.
- Go over the Jira backlog at the start of each sprint and re-rank tasks.
- Update Jira board status and sprint progress at the end of each sprint.
- Review and update the project risks each sprint.
- Post progress updates and absence notices in the team Discord channel.
- Organize and maintain the shared Drive folder for deliverables.
- Review each pull request and approve it or request changes.
- Record instructor and class feedback as Jira issues after each deliverable and team meeting.
- Submit each sprint deliverable to Submitty before its deadline.
- Hold a retrospective after the Interim and Beta releases and record process changes.

### **6.2 Requirements and Documentation**

- Resolve the open questions in the stories and use cases (shared-recipe notifications and opt-out, duplicate-ingredient merge rule, live vs. refresh updates, multiple recipes per meal slot) and record each decision.
- Update the Project Schedule and Project Status Report for each sprint.
- Document each REST endpoint (path, request, response, errors) in an API reference.
- Write (and keep up-to-date) the README with setup, configuration, and run-the-tests instructions.
- Write the test plan and the final test report.
- Draft the terms of use and privacy notice (content rights, 30-day data deletion, API attributions).
- Write the About-page and in-app help text.
- Write release notes for the Interim and Beta releases.
- Write the Best Practices document.
- Perform the final UML and documentation consistency pass.

### **6.3 Interface and Architecture Design**

- Build the Figma mockup of the main pages and record the walkthrough.
- Define the shared design system in Figma (colors, typography, spacing, components).
- Design the registration, login, and password-reset screens.
- Design the recipe upload/edit form, including validation-error states.
- Design the social-import flow (paste text, review draft, "Please check" markers).
- Design the recipe share dialog and notification panel.
- Design the household grocery list with its live-update indicator.
- Design the preferences screen (dietary restrictions, serving size, budget, goals, private mode).
- Design empty, loading, and error states for every list and data view.
- Design mobile layouts for every page.
- Map each frontend screen to its backend endpoints in an endpoint-mapping diagram.
- Define and document the trending-score formula and the step-count difficulty rule.
- Compare a rule-based parser and an AI agent for social import on sample posts, then choose one.
- Define the WebSocket message format for household live updates.
- Define the unit-compatibility and conversion table used to merge pantry and grocery quantities.

### **6.4 Infrastructure and Deployment**

- Create the GitHub repository (main and develop branches) and the Jira project.
- Create the Angular and NestJS workspaces with Jest, ESLint, and Prettier.
- Install, lint, check formatting, test, and build both workspaces on every push and pull request to main and develop.
- Enable branch protection so a failing pipeline blocks merging.
- Add test-coverage reporting with a 70% statement threshold to the pipeline.
- Create the Supabase project and configure dev, staging, and production environment variables.
- Store the Kroger, USDA, and API Ninjas keys as CI and server secrets.
- Deploy the backend and serve the Angular bundle over HTTPS.
- Configure secure WebSockets (WSS) on the deployed server.
- Set up uptime monitoring and request logging.
- Write a seed script that loads demo users, recipes, and pantry data.
- Deploy the Interim build (I) and the Beta build (B).

### **6.5 Accounts and Profiles (I)**

- Implement a NestJS guard that validates Supabase tokens on protected requests.
- Implement registration, login, and logout through Supabase.
- Implement password-reset request and confirmation.
- Implement profile GET/PATCH endpoints with display-name and bio length validation.
- Implement profile-picture upload with file-type and 5 MB size checks.
- Build the login, logout, and password-reset pages.
- Build the profile page for viewing and editing display name, bio, and picture.
- Write unit and integration tests for authentication, profile validation, and unauthorized access.

### **6.6 Recipes (I)**

- Implement the recipe creation, rejecting submissions without a title, ingredient, or step.
- Implement the recipe feed and detail endpoints, returning only recipes visible to the requester.
- Limit recipe updating to the author.
- Implement the recipe delete endpoint, removing the recipe from saved lists and planners.
- Implement private/public visibility with 403 responses for unauthorized access.
- Implement the serving-size scaling function (rounded to two decimals).
- Implement "create my own version" as a private copy with attribution to the original author.
- Implement save, unsave, and list endpoints for saved recipes, enforcing a recipe limit.
- Implement review endpoints (1–5 stars, one editable review per user, no self-review) and average-rating recalculation.
- Implement the recipe view counter.
- Build the recipe feed page with recipe cards.
- Build the recipe detail page with a servings adjuster.
- Build the recipe create/edit form with dynamic ingredients and step rows.
- Build the delete-confirmation dialog.
- Build the saved-recipes page and heart toggle.
- Build the review form and review list.
- Build the "Create my version" button and the original-author credit.
- Write unit tests for recipe validation, scaling, and visibility rules.
- Write integration tests for recipe CRUD, saved recipes, and reviews.

### **6.7 Pantry (I)**

- Implement the known-ingredient search endpoint.
- Implement custom-ingredient creation.
- Implement the pantry add endpoint (quantity, unit, optional expiration date) that combines compatible units.
- Implement pantry list, update, and remove endpoints.
- Implement the pantry-match calculation (share of a recipe’s ingredients the user owns).
- Build the pantry page listing each item’s name, quantity, and unit.
- Build the add-ingredient form with autocomplete and a "create custom ingredient" option.
- Build the edit and remove controls with a removal confirmation.
- Mark owned and missing ingredients on the recipe detail page.
- Write unit tests for unit merging and pantry matching.
- Write integration tests for pantry CRUD and persistence after reload.

### **6.8 Grocery List (I/B)**

- Implement grocery-list endpoints to add, edit quantity, remove, and mark items purchased.
- Implement grocery-list generation from one recipe at a chosen serving size, subtracting pantry quantities.
- Implement the user setting to add all recipe ingredients or only missing ones (B).
- Implement moving purchased items into the pantry.
- Implement grocery-list total cost from stored ingredient prices (B).
- Implement plain-text export and sending a list to another user (B).
- Build the grocery-list page (view, add, edit, remove, check off).
- Build the "Generate Grocery List" action with an "Already in your Pantry" section.
- Build the "add missing ingredients" button on the recipe detail page.
- Build the dialog that moves purchased items to the pantry.
- Build the share and export dialog (B).
- Write unit tests for grocery-list generation and pantry subtraction.
- Write integration tests for grocery-list endpoints.

### **6.9 Weekly Meal Planner (B)**

- Implement planner endpoints to add, list, move, and remove meals by day, meal slot, and servings.
- Implement the configurable week start day.
- Implement grocery-list generation from a planner week, merging identical ingredients with compatible units.
- Implement a shortfall warning when the pantry covers one recipe but not the combined plan.
- Build the week-view planner page.
- Build the add-to-planner dialog (day, meal, servings defaulting to the user’s preference).
- Build the "generate grocery list from plan" action.
- Write unit and integration tests for planner persistence and merged quantities.

### **6.10 Recipe Discovery: Search, Filter, Sort (B)**

- Implement title and ingredient search with case-insensitive partial matching.
- Implement dietary-restriction tagging and filtering (vegetarian, vegan, gluten-free, dairy-free, nut-free).
- Implement cuisine and mood tag assignment and filtering.
- Implement calorie and macronutrient range filters.
- Implement sorting by rating, total time, ingredient count, difficulty, pantry match, and price.
- Implement the trending score and the trending and newest sorts.
- Implement combined filters, one sort, and pagination in a single query.
- Add database indexes for search and sort fields and measure feed response times.
- Build the search bar and collapsible filter panel.
- Build the sort selector and active-filter chips.
- Build the Trending and New sections of the feed.
- Build the "Meal Suggestions" link from the pantry page to the pantry-match feed.
- Write unit and integration tests for filter combinations and sort order.

### **6.11 Preferences, Pricing, and Nutrition (B)**

- Implement preference endpoints (dietary restrictions, allergies, disliked ingredients, default sort, serving size, budget on/off).
- Apply stored preferences automatically to the feed and to serving-size defaults.
- Implement per-user ingredient price endpoints (set, edit, remove).
- Implement recipe cost estimation using user prices first, then Kroger prices.
- Implement calorie and macro calculation for recipes that lack them, labeled as estimates.
- Implement budget-based exclusion or flagging of recipes.
- Implement calorie and macro goal endpoints, rejecting splits that do not total 100%.
- Build the preferences page.
- Build the ingredient price editor.
- Build "Estimate" labels and the not-medical-or-allergy-advice disclaimer.
- Build the goals form.
- Write unit and integration tests for preference persistence, cost calculation, and goal validation.

### **6.12 Sharing, Social Import, and Following (B)**

- Implement sharing a recipe with a specific user, plus revoking access.
- Implement share-by-link and share-with-all-users options.
- Implement notification storage and retrieval endpoints.
- Enforce the "don’t send me recipes" private-mode setting.
- Implement the import endpoint that accepts pasted text and an optional source link.
- Implement the TikTok parser module.
- Implement the Instagram parser module.
- Implement the YouTube Shorts parser module.
- Implement draft-recipe generation with "Please check" markers and source attribution.
- Implement follow, unfollow, and a followed-users recipe list (C).
- Build the share dialog, notification panel, and received-recipes list.
- Build the import page (paste text, review and edit draft, confirm).
- Build the follow button and following feed (C).
- Assemble a labelled sample set of posts from each platform for measuring extraction accuracy.
- Write tests for parser output, draft editing, and the 80% ingredient-accuracy target.

### **6.13 Household Collaboration (B)**

- Implement household create, join, and leave endpoints.
- Scope the grocery list to a household so all members see the same list.
- Implement the duplicate-ingredient merge rule.
- Implement concurrent-edit handling so simultaneous changes do not lose data.
- Implement the WebSocket gateway that broadcasts list changes within 2 seconds.
- Build the household create, join, and member-management screens.
- Build the live-update indicator and the shared purchased status.
- Build the duplicate-merge notice.
- Write a concurrency test in which two accounts add the same item at once.

### **6.14 External Service Integrations (I/B)**

- Evaluate and select the nutrition, pricing, and recipe APIs.
- Implement the USDA FoodData Central client and map its responses to ingredient nutrition.
- Implement the Kroger API client, including authentication and price mapping.
- Implement the API Ninjas client and import a starter set of common recipes.
- Implement a shared 15-second timeout and error wrapper for all external calls.
- Cache external responses to limit repeated calls.
- Implement graceful degradation that tells the user which nutrition or price figures are missing.
- Add the required attribution for Supabase, Kroger, API Ninjas, and USDA FoodData Central.
- Write mocked-service tests for each client, including timeout and outage cases.

### **6.15 Stretch Features (C)**

- Implement the cook-recipe endpoint that deducts pantry quantities and records servings eaten.
- Build the step-by-step cook-mode screen.
- Implement the mark-meal-eaten endpoint and daily macro summary against goals.
- Build the daily nutrition summary view.
- Implement the scheduled expiration-alert job.
- Build the expiring-soon list and alert settings.
- Implement shared household pantry and planner.
- Implement barcode lookup and build the scanner screen.
- Implement offline caching of saved recipes and the current grocery list.
- Integrate Stripe subscription tiers.

### **6.16 Testing, Verification, and Validation**

- Write end-to-end tests for the Interim flow (register, upload recipe, save, generate grocery list).
- Write end-to-end tests for the Beta flows (plan to grocery list, share, import, household).
- Execute the acceptance tests for Interim user stories and record results in the test report.
- Execute the acceptance tests for Beta user stories and record results in the test report.
- Test that every protected endpoint returns 401/403 and that private data is isolated between users.
- Test input sanitization against script and SQL injection.
- Test core behavior when each external service is unavailable.
- Measure social-import completion time against the 10-second target.
- Verify scaled grocery quantities are correct across the full test suite.
- Test layouts at 360 px and 1024 px widths.
- Test the application on current Chrome, Firefox, and Edge.
- Run a usability session measuring navigation-label comprehension (90% target) and interaction counts for save and grocery-list tasks.
- Verify data persists across logout, page reload, and server restart.
- Restore a database backup in a test environment to verify it.
- Review the coverage report and add tests to reach 70% in both workspaces.
- Run the full regression suite before each release.
- Triage and fix defects found before the Interim release and in Interim demo feedback.
- Triage and fix Beta defects.

### **6.17 Presentations and Demonstrations**

- Prepare the Interim presentation slides.
- Write the Interim demo script and assign speaking roles.
- Create the demo account and seed data on the deployed build.
- Deliver the Interim presentation and demonstration.
- Prepare the Beta presentation slides and demo script.
- Rehearse the Beta demo on the deployed build.
- Deliver the Beta presentation and demonstration.
- Prepare the final project presentation.
- Record a backup demo video of the working application.

# **Part 7\. Project Schedule**

Our small meeting is every Wednesday at 2:00pm. Each sprint has been designed to end at this meeting time so that we can discuss the assigned tasks for the next sprint/week.

| Sprint | Start      | End             | Target                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | :--------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | Sun 9/13   | Wed 9/16        | Developing the project idea. Coming up with feature ideas, user scenarios, personas, and selecting the Product Owner.                                                                                                                                                                                                                                                             |
| 1      | Thur 9/17  | Wed 9/23        | Start sprint 1 deliverables: vision statement, schedule, user scenarios and personas. Organize a shared drive for documents that we will work on.                                                                                                                                                                                                                                 |
| 2      | Thur 9/24  | Wed 9/30        | Finalize sprint 1 deliverables, decide on a tech stack to work on. Utilize Jira for task management.                                                                                                                                                                                                                                                                              |
| 3      | Thur 10/1  | Wed 10/7        | Setup initial boilerplate and code repository using the decided tech stack. High-level organization of the program structure and describing how we will implement it.                                                                                                                                                                                                             |
| 4      | Thur 10/8  | Wed 10/14       | Finish sprint 4 deliverables, flesh out all of our required tasks, user stories, and UI mockup, which are all critical prerequisites to implementation in code.                                                                                                                                                                                                                   |
| 5      | Thur 10/15 | Wed 10/21       | Implement basic backend structure that is ready for our single-user features as described by our feature list (must/should). E.g., basic grocery list, pantry inventory, user profile, single-user create/view/remove items.                                                                                                                                                      |
| 6      | Thur 10/22 | Wed 10/28       | Verify our test suite for the implemented features: pantry and recipe modules; recipe browsing; reviews and ratings. Begin household/multi-user data model. Deliver a shared household grocery list in which multiple users can see the same list, and let users import recipes from social media platforms (TikTok, Instagram, and YouTube Shorts) in addition to manual upload. |
| 7      | Thur 10/29 | Wed 11/4        | Add missing recipe ingredients to the grocery list automatically (Businessman story), finalize class and sequence diagrams for the design documents, and polish the Interim Release.                                                                                                                                                                                              |
| 8      | Thur 11/5  | Wed 11/11       | Fix bugs identified in the Interim demo feedback, deliver the first version of the weekly planner (adding a recipe to a day of the week with a number of servings), add dietary and budget preference settings, and lay the groundwork for filtering and sorting by macros, price, time, difficulty, and tags.                                                                    |
| 9      | Thur 11/12 | Wed 11/18       | Finish filtering and sorting, including sorting by rating and popularity and a trending recipes view, add the saved/favorite recipes tab (Student story), and deliver recipe sharing with notifications and a private-mode toggle (Chef story).                                                                                                                                   |
| 10     | Thur 11/19 | Wed 11/25       | Handle concurrency in the shared grocery list, with duplicate-item merging and a live-update notice (Roommate story), extend the planner with the quantity/multi-serving option so that planned meals scale the generated grocery list (Athlete story), and polish the Beta Release.                                                                                              |
| 11     | Thur 11/26 | Wed 12/2 \- end | Complete final bug fixes, the Best Practices document, a final UML and documentation pass, and presentation preparation.                                                                                                                                                                                                                                                          |

## **7.1 Interim Release (Friday 11/6)**

- Pantry inventory: add, remove, view ingredients.

- Manual recipe upload (user enters ingredients \+ steps).

- Recipe browsing/viewing.

- Saving a recipe to a list for a single user.

- User profiles with username, display name, bio, profile picture, and their own saved recipes, grocery lists, and pantry inventory.

- Grocery list: create, view, add, remove items for a single user.

- Core navigation tying the above together.

- Automated test coverage for pantry \+ recipe CRUD paths.

- Generating grocery list for a given recipe (adjusting quantity/serving size of recipe reflects in grocery list).

- Interim beta presentation and demonstration.

## **7.2 Beta Release (Friday 12/4)**

- Recipe to Grocery List by prompting the user for missing ingredients (Businessman story).

  - Add a setting for auto-add all ingredients from recipe to grocery list/prompt user for potential missing ingredients by cross referencing Inventory and Recipe.

- Weekly meal planner, with a quantity/multi-serving option (Chef \+ Athlete stories).

- Filtering/sorting: macros (protein, fat, carbs, calories), ingredient cost, difficulty (step count), time, tags (Athlete/Student/Businessman stories).

- Saved/favorite recipes tab.

- Recipe sharing between users, with notification when a recipe is received.

  - A setting for private/"don't send me recipes" mode.

- Shared household grocery list: duplicate-item merge or notification, live-update indicator when someone marks an item purchased.

  - Grocery list sharing between users (sending a grocery list to a user)/exporting grocery list to notes app.

- Recipe upload from social media platforms (tiktok, instagram, yt shorts).

- Users can manage dietary and budget preferences through their settings.

  - Budget preferences can be turned on or off. If on, budget preferences are taken into account when searching for recipes. Generated grocery lists from these searched recipes will be within budget.

  - Dietary preferences on means searched recipes will fit your dietary restrictions.

- Beta release presentation and demonstration.
