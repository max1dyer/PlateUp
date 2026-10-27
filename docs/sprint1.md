# **PlateUp**

*Plan less, cook more.*

**Sprint 1 Deliverable: Vision Statement, Personas and User Scenarios, Project Schedule, Project Status Report, and Contribution Summary.**

Team: Max Dyer (Product Owner), Matt Durcan (Scrum Master), Will Shockey, Kartik Prabhu.

---

# **Part 1\.   Vision Statement**

## **1.1   Executive Summary**

Home cooking depends on a chain of small tasks: finding a recipe, checking what is already in the kitchen, deciding what to buy, shopping, and finally cooking. For most people these tasks live in different places. Recipes are scattered across bookmarks, screenshots, and social media posts; grocery lists sit in notes applications or on paper; pantry contents are remembered rather than recorded; and weekly plans are improvised or kept in spreadsheets. In shared households this fragmentation is worse, because roommates and family members must coordinate purchases and meals without a common source of truth. The result is wasted time, duplicate purchases, and spoiled food \- burdens that fall hardest on students and others who cook on tight budgets or specific nutrition goals.

PlateUp addresses this problem by unifying recipes, pantry inventory, grocery lists, and weekly meal planning in a single web application in which an action in one area supports the others. Adding a recipe to the weekly planner, for example, allows PlateUp to compare the recipe against the user's pantry and place only the missing ingredients on the grocery list, scaled to the number of servings planned. Social features extend this: users can share recipes, import them from social media, and maintain grocery lists together with the people they live with.

**Elevator pitch.** For home cooks and shared households who juggle recipes, grocery lists, and pantry inventories across separate apps, PlateUp is a web-based meal-planning platform that connects all of them in one place. Unlike existing tools that each excel at one slice of the problem, or that reserve pantry-aware planning for paid tiers, PlateUp builds the pantry, the grocery list, and the weekly planner on one connected foundation, keeps the cost of a meal in view, and adds a community layer for sharing recipes and coordinating shopping with housemates. Plan less, cook more.

The business case for PlateUp rests on the benefit it offers to individuals and shared households who meal prep, split cooking responsibilities, or want a more organized and budget-conscious approach to feeding themselves. Section 1.3 analyzes four existing products (Paprika, AnyList, Samsung Food, and Mealime) and finds that each is strong in its own area, but none, judging by their public descriptions, combines pantry-aware planning, cost awareness, and household collaboration as core features. That section also identifies the two principal product risks, a high switching cost for users with established routines and the effort of initial data entry, and outlines a possible subscription model for the future. The project's stakeholders, described in more detail later, are the four team members, each of whom is also a prospective user with a personal stake, together with the five members of the Team Instructor group, who mentor and evaluate the project.

PlateUp is being built iteratively through Scrum sprints using a TypeScript stack. Core infrastructure, recipe management, and single-user kitchen features arrive first for the Interim Release, and collaborative features follow in the Beta Release. The primary project risks are the complexity of the data interactions between the pantry and the grocery list, synchronization conflicts in shared households, scope creep, and the computational cost of ranking recipes. Although these risks may seem daunting in other projects, the mitigation techniques and methodologies the team is following will ensure smooth progress and development. The remainder of this document presents the major features of the product, two personas with detailed user scenarios, the sprint schedule and release plans, a project status report, and finally a contribution summary.

## **1.2   Project Description and Major Features**

PlateUp is an account-based web application that works on both desktop and mobile browsers (Firefox, Chrome, and Microsoft Edge); the team will not build a separate native mobile app. It is organized around a small set of pages: Home, Recipes, Saved, Planner, Grocery List, Pantry, and Profile, along with About and Contact pages. A consistent design theme and clearly named buttons and tabs keep the user flow predictable. The recipe feed, saved recipes, pantry, grocery list, planner, and profile are each one click away from the main navigation bar. Each user has a profile with a username, display name, bio, and profile picture, as well as their own saved recipes, grocery lists, and pantry inventory. The application's features fall into three tiers: a baseline utility that makes PlateUp useful for inventory and recipe management, a set of connecting features that unify features like our inventory system and grocery list generation, and a community layer that engages the social aspect of our product.

**The baseline: recipes, pantry, and grocery lists**

The baseline, which the team has committed to deliver in the Interim Release, is a kitchen toolkit centered on the individual cook. Users can upload their own recipes by entering ingredients and steps, edit or delete those recipes afterward. They can browse recipes created by others and save recipes to a personal collection. Users can also rate and review recipes, which gives every recipe a visible overall rating and gives cooks feedback on what they contribute. A recipe page presents the title, a thumbnail, the overall rating, the ingredient list, the preparation steps, the time to complete, nutritional information (calories, fats, protein, and carbohydrates), and credit to the recipe's creator. The pantry inventory lets users add, remove, and view the ingredients they have on hand. The grocery list lets them create, view, add, and remove items, marking them as purchased. Finally, a user can generate a grocery list for a single recipe. Adjusting the recipe's serving size scales the quantities on that list. These features are fundamental; without them PlateUp is not a functioning recipe and shopping tool, and cannot proceed with the later features we expect.

**Connecting features: planning and pantry-aware shopping**

What distinguishes PlateUp from a collection of separate utilities is the way the baseline tools inform one another. These connecting features are scheduled for the Beta Release. Users will have a planner tab showing a weekly schedule they can add recipes to by choosing the day and the number of servings. PlateUp can then compare the recipe with the pantry and build a grocery list containing only the missing ingredients, in the quantities the chosen serving size requires. A user setting allows people to add all of a recipe's ingredients regardless of what is already in the pantry. When a planned meal is completed, the pantry quantities are adjusted automatically, so the inventory stays accurate without constant manual upkeep. Because automation should never take control away from the user, every auto-populated field or list, from generated grocery lists to pantry quantities, can still be edited by hand. In the other direction, the pantry can drive discovery: a Meal Suggestions option lists recipes ranked by how few ingredients the user would still need to buy, which supports the budget-conscious and low-waste goals at the center of the project.

**Finding the right recipe: search, filtering, and personalization**

Because a recipe collection is only as useful as it is searchable, the Beta Release also introduces filtering and sorting. Users can narrow results by macronutrients (protein, fat, carbohydrates, and calories), ingredient cost (calculated only from ingredients the user does not already own), difficulty (measured by step count), preparation time, and tags such as cuisine, dietary restriction, or mood. Results can also be sorted by rating and popularity, and a trending view surfaces the recipes that are gaining the most attention. This lets newcomers see what dishes the community is cooking. Each user's profile settings store dietary restrictions, a default serving size, a preferred recipe sort order, and budget preferences. When dietary preferences are enabled, search results exclude recipes outside the user’s dietary preferences; when budget preferences are enabled, searches take the budget into account by ensuring potential grocery lists generated from the resulting recipes stay within budget. Both settings can be switched on or off, so the application adapts to the user.

**Community layer: sharing and collaboration**

The features that most clearly differentiate PlateUp are the collaborative ones, which the team treats as supplemental to the baseline but central to the product's identity. Users can share recipes directly with one another and receive a notification when a recipe arrives \- with a private mode for people who prefer not to receive them. Because recipes are user-contributed, authors can set each of their recipes to public or private. Other users can take an existing recipe and create their own version of it. Users can also import recipes from social media platforms (TikTok, Instagram, and YouTube Shorts) by pasting a link, which removes much of the manual data entry that discourages new users. For shared households, PlateUp offers a common grocery list that merges duplicate items, or alerts users to them, and shows a live indicator when a housemate marks an item as purchased. Lists can also be sent to another user or exported to a notes application. Beyond these committed features, the long-term vision includes following other cooks so that users can easily find the recipes of people with similar tastes, which would complete the social experience. Further extensions under consideration include shared planners and shared pantries for household members, barcode scanning to add ingredients to the pantry, a daily calorie and macro summary based on the planned meals, and offline support. The team intends to pursue these as schedule permits once the Beta commitments are met. Some features are deliberately out of scope: private messaging, blog or microblog-style posting, and a native mobile app.

## **1.3   Business Case**

PlateUp targets individuals and shared households who meal prep, share cooking responsibilities, or want a more organized and budget-conscious way to plan meals. It is intended to serve users with different priorities, whether they are tracking calories, discovering new recipes, or simply looking for easy meals. These users currently rely on several notes, apps, and habits to find recipes, assemble ingredients, and remember what is in the pantry. PlateUp's benefit is that it connects these tasks. PlateUp saves time through less duplicated data entry, saves money by preventing duplicate purchases and surfacing cheaper recipes, and reduces the friction of coordinating meals among households. The team members themselves are among the intended users, which gives the project a built-in source of feedback throughout development.

**Competitive Analysis**

We have selected three competitors that are currently in the market that most closely match PlateUp's intended scope: Paprika for personal recipe collection and planning, AnyList for shared shopping lists, and Samsung Food as an all-in-one platform with the broadest overlap. The analysis below is based on each product's own website.

**Paprika** ([link](https://www.paprikaapp.com/)) is a recipe manager built around a user's personal recipe collection. Its built-in browser downloads recipes from anywhere on the web. Its cloud sync keeps recipes, grocery lists, and meal plans consistent across a user's devices. Its grocery lists allow for items to be sorted by store aisle and similar ingredients can be combined. While cooking, users can scale ingredients to a serving size, convert between metric and imperial units, cross off ingredients, and start timers detected automatically in the directions. Paprika is the most relevant competitor because it overlaps most with PlateUp's core. However, it is organized around an individual's own collection, and its website describes no community features such as shared recipe feeds, ratings, or discovery from other cooks. PlateUp differs by treating recipes as something users find, share, and review together, and by linking the pantry directly to recipe discovery and grocery generation rather than keeping it as a separate screen.

**AnyList** ([link](https://www.anylist.com/)) is a shared grocery list. Its defining strength is real-time collaboration between the members of a list. It suggests common items as the user types, groups items by category, and supports hands-free entry through Siri. AnyList also lets users save recipes, including from email messages and popular websites, add a recipe's ingredients to the list, and plan meals on a calendar. Its collaboration is centered on the list itself, however, and its site does not advertise a pantry inventory or recipe suggestions based on what a household already owns. PlateUp differs by extending collaboration beyond the list to recipes, planning, and discovery, and by generating the shared list from a pantry-aware plan instead of requiring users to build it item by item. It also differs in that PlateUp will extend a focus not only to household collaboration, but to the community of users via public and sharable recipes.

**Samsung Food** ([link](https://samsungfood.com/)) offers a free app with a library of more than 240,000 public recipes that users can search by ingredient or filter by meal type, cook time, cuisine, and fourteen diets; it lets users save recipes from any website; and it provides nutrition information and health scores for a large share of its recipes. Users plan weekly meals, turn them into shopping lists, and share grocery lists with family or friends. A paid tier, Samsung Food+, adds automated pantry management with cooking suggestions based on what is on hand, along with AI-personalized meal plans and nutrition advice. PlateUp differs from this competitor by making pantry-aware planning part of the core product, by treating cost as a first-class factor through price-based sorting and budget-limited grocery lists, by centering collaboration on the household rather than on large public communities, and by letting users import recipes directly from TikTok, Instagram, and YouTube Shorts.

These products we've analyzed show that the market has a strong tool for individual pieces of the workflow, or relies on paid tiers to access varying features. What sets PlateUp apart is its pantry-aware planning, cost awareness, and the household and community collaboration. Our project has the potential to be monetized with additional features being locked behind a subscription, but this would only include features involving AI-assistance or related topics. We do not have any rush to set up a payment model.

**Product Risks**

Two primary risks arise from moving PlateUp into this existing market. The first is a high switching cost. Users who already have routines built around competing apps or physical notes may hesitate to migrate, particularly if the marketing does not make PlateUp's advantages clear. The team's mitigation is to ensure that the benefits are demonstrated quickly, through features like social media recipe import and pantry-based Meal Suggestions, and to ensure that each part of the app (such as the grocery list) is useful on its own, so that users can adopt PlateUp gradually. The second risk is data entry. Entering personal recipes or logging an entire pantry could demand so much effort that users abandon the app before experiencing its benefits. Importing recipes from social media is the main mitigation, along with manual upload and an inventory that users can build up over time rather than all at once. Additionally, our team will use an API to import common existing recipes for any user to use.

## **1.4   Stakeholders**

* Max Dyer (Product Owner & Developer)

  * *Qualifications:* Computer Science and Communications dual major at RPI interested in UI design.

  * *Role*: Responsible for being the spokesperson and advocate of the product and user stories. Contributes to design, implementation, testing, and documentation of PlateUp.

  * *Stake:* Building a usable app to keep recipes, grocery lists, pantry inventory, and a meal planner in one place to easily meal plan with roommates.

* Matt Durcan (Scrum Master & Developer)

  * *Qualifications:* Computer Science major at RPI with leadership experience in a fraternity.

  * *Role:* Responsible for leading standups and managing tasks, while contributing to the implementation and progress of the application.

  * *Stake:* Building an app that can be used for our fraternity meal plan and our members who volunteer to prepare meals.

* Will Shockey (Developer)

  * *Qualifications:* Computer Science major at RPI interested in backend development. 

  * *Role:* Responsible for challenging/proposing new ideas that may or may not fit into the scope of the project. Contributes to the implementation of various features in order to complete the project in a timely manner.

  * *Stake:* Building a web app that can be used for finding and meal planning recipes with good macros (calories, protein, carbs, fats).

* Kartik Prabhu (Developer)

  * *Qualifications:* Computer science student with a dual in Economics.

  * *Role:* Part of the implementation and making sure every goal or checkpoint is reached in a timely manner.

  * *Stake:* Building an app that helps record recipes while staying on a budget so no one has to kill their hunger.

* Team Instructors (John Sturman, Saikat Islam Khan Bappy, Srihari Sridharan, Rafiuzzaman Khan, Jamie Alfaro):

  * *Role*: Responsible for evaluating and mentoring the project, and ensuring requirements are met.

  * *Stake:* Wanting team members to succeed in creating robust software; "Our success is your success."

## **1.5   Project Risks**

We have identified four major project risks. Each one is discussed below, mentions the impact if it is not mitigated, and the strategy we will use to reduce it.

**Complex data interaction.** The continuous background interaction between pantry inventory and automated grocery list generation may involve complex logic, particularly when additional features are added that impact both sets of data. If this is not mitigated, database inconsistencies could lead to inaccurate grocery lists and general data loss, which would likely go unnoticed by the user, leading to frustration over the core functionality of the application. Comprehensive unit tests and automated integration testing will be a critical component to try and minimize the possibility for data loss related bugs. One immediate mitigation we have made is to set up automated checks running on every pull request through Github Actions to verify code quality and functionality.

**Household synchronization conflicts.** Sharing grocery lists across households introduces the risk regarding concurrent updates. This prompts the decision regarding how frequent we choose to synchronize between a household, or if we need to include other protective measures. If we don't explicitly consider these possible concurrency bugs, when two users add or check off items simultaneously, it could result in duplicated entries, data loss, or over-purchasing at the store.

**Scope creep.** The volume of planned features (social networking, pantry tracking, nutritional calculation) is ambitious for the timeframe to deliver. If not properly managed, the team may fail to deliver an MVP by the final deadline. This is a common risk that most projects identify, but it is nothing that cannot be easily handled by well-designed project management and methodologies. By adhering to the Agile methodology and splitting responsibility amongst the team members, we increase our chances of reaching our MVP goal. Part of the mitigation of this involves assigning the correct priority to each feature, to accurately predict the difficulty and time required for each feature. This was already partially completed by ranking each feature and requirement on a scale from "won't", "could", "should", or "must", include in the project.

**Recipe sorting performance.** Developing ranking rules to sort recipes by popularity, trends, and dynamically calculated nutritional data may be computationally heavy depending on the amount of data and users we can support. Without falling for the trap of excessive pre-optimizations, we need to be considerate of the choices that we make that may impact performance when the application scales, although this isn't a priority when delivering the MVP with a small scale of users. While this isn't an inherent risk to the project itself, it still impacts the user. Also, if we choose to neglect an extensible design, it won't just affect how we are able to optimize later on, but it will make the implementation of smaller new features and additions to the codebase more difficult in general.

# **Part 2\.   Personas and User Scenarios**

**Persona 1: Peter Jones**

Peter Jones is a 20-year-old Aerophysics student at RPI balancing a difficult course load with a part-time job at Walmart. Living off-campus with roommates on a tight budget of \$680 a month, Peter has to stretch every dollar while managing rent, tuition, and groceries. Outside of the classroom, he is highly disciplined about his physical health, focusing on the gym, injury prevention, and cooking his own meals. Because his schedule is packed with studying physics and working retail, time management is a top priority and critical to his success this year. He needs a way to quickly prepare healthy, macro-balanced meals for the week without the added cognitive overhead and stress of finding what his next meal is going to be. On top of this goal for an organized set of meal plans that helps optimize his time, he needs to be very conscious of how much he plans to spend each week for all of his food. 

**Scenario: Meal Prepping on a Budget.**

*Goal: Plan seven days of healthy, high-protein meals and buy only the groceries he still needs, spending as little as possible.*

At the end of the week, Peter starts meal planning for 7 meals, one for each day. He needs to know what groceries to buy while staying as frugal as possible. He opens the PlateUp webapp and navigates to the “Inventory” tab on the bottom navigation bar to update his current inventory. He clicks on the “Update Inventory” button at the bottom of the Inventory page to update his inventory based on the ingredients that he used the past few days. A new panel appears listing all the ingredients that have been saved from his pantry. He selects the Minus button next to the ingredients he no longer has. For each item that he tries to remove, he is prompted with a confirmation popup: “Are you sure you want to remove x from your inventory?” He removes all items from his inventory he no longer has and is left with what is currently at his disposal in his pantry.

In order to figure out what to cook with the ingredients he already has, Peter clicks on the “Meal Suggestions" button at the top of the Inventory page to see a list of recipes available with the current ingredients in his apartment. He is brought to the “Recipes Feed” tab, automatically sorted in ascending order of the number of ingredients not found in his pantry. He sees several recipes with their names and thumbnails on the page. To narrow his search down further, he opens the collapsible filter options under the search bar. He sorts for high protein by dragging a slider to the minimum amount of protein he wants each serving to have. He also sorts by price low to high which only takes into account the price of ingredients he doesn’t already have. He selects the top recipe and views the recipe description by selecting the thumbnail. The description includes a list of ingredients with a checkmark or a cross, denoting which ingredients he owns in his inventory, along with a list of steps, the macro-nutrient values, and credit to the creator of the recipe. He confirms that the macros fit the requirements of his meal plan and selects the Bookmark button at the top right corner of the screen to add the recipe to his saved recipes.

Peter then scrolls down to the bottom of the recipe description page and fills out the “Quantity” field with the number 7, denoting the number of servings he plans to prepare for the upcoming week. He then selects the “Generate Grocery List” that has appeared after entering a value into the "Quantity" field, which brings him to the Grocery List page with the newly added ingredients necessary for the recipe highlighted in an accented color. Below the Grocery List, another list is displayed that shows the ingredients that are necessary for the recipe but already exist in his pantry, which Peter double checks to make sure that he doesn't already have any other different recipe plans for the existing ingredients.

At the grocery store, Peter toggles the checkbox next to each item on the screen as he works his way through the grocery list. When he’s done grocery shopping, he taps the "Remove Checked Items" button at the top of the screen, clearing his list and heading home to follow the recipe for next week's dinners.

**Persona 2: Tiana Coleman**

Tiana Coleman is a 24-year-old Civil Planner who recently graduated with a dual degree in Civil Engineering and Graphic Design. Earning \$70,000 a year with an additional \$5,000 from her side hustle as a social media influencer, she enjoys a vibrant social life in a city high-rise, sharing an apartment with her former sorority sisters turned best friends. Tiana is obsessed with aesthetics, sustainable design, and following the latest digital food trends so that she can get the most impressions on her media platforms. Her weekends are spent photographing visually striking meals and filming mukbang content for her followers on Tiktok and Instagram. She is constantly looking for colorful, trending recipes to share with her friends, but managing the sprawling ingredients lists for her large-scale cooking videos across different apps has become a chaotic chore.

**Scenario: Planning a Trendy Mukbang.**

*Goal: Turn a trending TikTok recipe into a complete grocery list, including snacks, for her next video on social media.*

Tiana is looking to see what mukbang content is trending on social media. She opens TikTok and scrolls the "For You" page looking for promising recipes. When she finds a popular video with a meal she wants, she clicks the share button and copies the link. She opens the PlateUp webapp and clicks the “My Recipes” tab on the bottom navigation bar. This brings her to a list of all her saved recipes. She clicks the “Import Recipe” button at the top of the page. She is prompted to choose between importing a recipe manually or importing a recipe from social media. She clicks the “Import Recipe From Social Media” button. A text field prompting for a social media url pops up and she pastes the tiktok video link she had copied. She then selects the “Get Recipe” button at the bottom of the page. After a moment of loading, she lands back on the saved recipes screen, seeing the name of the new recipe she just imported along with a default thumbnail.

Tiana clicks on the recipe and is taken to a screen with a detailed description of the recipe, including a list of ingredients with a checkmark or a cross, denoting which ingredients she owns in her inventory, along with a list of steps, the macro-nutrient values, and credit to the tiktok page the recipe was imported from. On the description page, she clicks the “Generate Grocery List” button at the bottom of the page. Since she has the setting “Generate Grocery List With All Recipe Ingredients” turned on, all ingredients in the recipe are added to the grocery list even if they are already in her inventory. After the grocery list is fully generated, she is taken to the “Grocery List” tab. Here she can look at the amount of each ingredient she needs to buy in order to make the mukbang recipe she saw on TikTok. 

Tiana decides she also wants to have snacks for her mukbang. She clicks the “Update Grocery List” button at the bottom of the Grocery List page and selects the plus next to the first empty line in the grocery list. She manually adds a few items by typing the name of the item and clicking the “Add To Grocery List” button at the bottom of the screen between each new entry. When she’s done, she clicks the “Finish Updating” button at the bottom of the screen. She now has a grocery list containing all of the items she will need to create her own successful mukbang video.

At the grocery store, Tiana taps the check-off toggle next to each item on the screen as she works her way through the grocery list. When she’s done grocery shopping, she taps the “Remove Checked Items” button at the top of the screen, clearing her list and heading home to follow the recipe she found earlier.

# **Part 3\.   Project Schedule**

Our small meeting is every Wednesday at 2:00pm. Each sprint has been designed to end at this meeting time so that we can discuss the assigned tasks for the next sprint/week.

| Sprint | Start  | End  | Target |
| ----- | :---- | :---- | :---- |
| 0 | Sun 9/13 | Wed 9/16 | Developing the project idea. Coming up with feature ideas, user scenarios, personas, and selecting the Product Owner. |
| 1 | Thur 9/17 | Wed 9/23  | Start sprint 1 deliverables: vision statement, schedule, user scenarios and personas. Organize a shared drive for documents that we will work on. |
| 2 | Thur 9/24 | Wed 9/30 | Finalize sprint 1 deliverables, decide on a tech stack to work on. Utilize Jira for task management. |
| 3 | Thur 10/1 | Wed 10/7 | Setup initial boilerplate and code repository using the decided tech stack. High-level organization of the program structure and describing how we will implement it. |
| 4 | Thur 10/8 | Wed 10/14 | Implement basic single-user features as described by our feature list (must/should). E.g., basic grocery list, pantry inventory, user profile, single-user create/view/remove items. |
| 5 | Thur 10/15 | Wed 10/21 | Verify our test suite for the implemented features: pantry and recipe modules; recipe browsing; reviews and ratings. Begin household/multi-user data model.  |
| 6 | Thur 10/22 | Wed 10/28 | Deliver a shared household grocery list in which multiple users can see the same list, and let users import recipes from social media platforms (TikTok, Instagram, and YouTube Shorts) in addition to manual upload. |
| 7 | Thur 10/29 | Wed 11/4 | Add missing recipe ingredients to the grocery list automatically (Businessman story), finalize class and sequence diagrams for the design documents, and polish the Interim Release. |
| 8 | Thur 11/5 | Wed 11/11 | Fix bugs identified in the Interim demo feedback, deliver the first version of the weekly planner (adding a recipe to a day of the week with a number of servings), add dietary and budget preference settings, and lay the groundwork for filtering and sorting by macros, price, time, difficulty, and tags. |
| 9 | Thur 11/12 | Wed 11/18 | Finish filtering and sorting, including sorting by rating and popularity and a trending recipes view, add the saved/favorite recipes tab (Student story), and deliver recipe sharing with notifications and a private-mode toggle (Chef story). |
| 10 | Thur 11/19 | Wed 11/25 | Handle concurrency in the shared grocery list, with duplicate-item merging and a live-update notice (Roommate story), extend the planner with the quantity/multi-serving option so that planned meals scale the generated grocery list (Athlete story), and polish the Beta Release. |
| 11 | Thur 11/26 | Wed 12/2 \- end | Complete final bug fixes, the Best Practices document, a final UML and documentation pass, and presentation preparation. |

## **3.1   Interim Release (Friday 11/6)**

* Pantry inventory: add, remove, view ingredients.

* Manual recipe upload (user enters ingredients \+ steps).

* Recipe browsing/viewing.

* Saving a recipe to a list for a single user.

* User profiles with username, display name, bio, profile picture, and their own saved recipes, grocery lists, and pantry inventory. 

* Grocery list: create, view, add, remove items for a single user.

* Core navigation tying the above together.

* Automated test coverage for pantry \+ recipe CRUD paths.

* Generating grocery list for a given recipe (adjusting quantity/serving size of recipe reflects in grocery list).

## **3.2   Beta Release (Friday 12/4)**

* Recipe to Grocery List by prompting the user for missing ingredients (Businessman story).

  * Add a setting for auto-add all ingredients from recipe to grocery list/prompt user for potential missing ingredients by cross referencing Inventory and Recipe.

* Weekly meal planner, with a quantity/multi-serving option (Chef \+ Athlete stories).

* Filtering/sorting: macros (protein, fat, carbs, calories), ingredient cost, difficulty (step count), time, tags (Athlete/Student/Businessman stories).

* Saved/favorite recipes tab.

* Recipe sharing between users, with notification when a recipe is received.

  * A setting for private/"don't send me recipes" mode.

* Shared household grocery list: duplicate-item merge or notification, live-update indicator when someone marks an item purchased.

  * Grocery list sharing between users (sending a grocery list to a user)/exporting grocery list to notes app.

* Recipe upload from social media platforms (tiktok, instagram, yt shorts).

* Users can manage dietary and budget preferences through their settings.

  * Budget preferences can be turned on or off. If on, budget preferences are taken into account when searching for recipes. Generated grocery lists from these searched recipes will be within budget.

  * Dietary preferences on means searched recipes will fit your dietary restrictions.

# **Part 4\.   Project Status Report**

## **4.1   Summary of Progress**

Over the first two weeks of the project, our team created projects in collaboration applications, such as Github for product management, Jira for goals, and Figma for design testing. We finalized team roles (Product Owner: Max & Scrum Master: Matt). We defined the initial technology stack with TypeScript with Angular for the frontend, NestJS for the backend, Jest for testing, and ESLint/Prettier for formatting. These decisions were made by everyone in discussion.

We completed Sprint 1 drafts and final deliverables, including the Vision Statement (Max & Matt), Project Schedule (Kartik & Matt), and User Scenarios & Personas (Will), Project Status Report (Kartik & Max), with revisions done by everyone. We mapped out our essential UI features, drafted initial screen layouts, and outlined core navigation across key pages (Home, Logged-in Home, About, Contact, Recipes, Saved, Planner, Profile, Grocery List, and Pantry). We are currently focused on creating a frontend-to-backend endpoint mapping diagram, defining API requirements, and setting up the backend skeleton.

## **4.2   Issues Encountered**

| Issue | Summary | Responsible | Measures being taken |
| :---- | :---- | :---- | :---- |
| Feature complexity | Writing the user stories revealed more operational complexity than initially anticipated, but also fleshed out a lot of great ideas that the application should include. | Max (Product Owner), with Will | Structuring a fixed page layout and detailed UI feature mapping to establish project boundaries. Fleshing out exactly what features are a part of the core application and what are supplementary. |
| Selecting tech stack and tools | Need to align team skills with optimal development, build, and testing tools. | Matt, with the full team. | Selected a unified TypeScript stack (NestJS/Angular) with Jest, ESLint, Prettier, Vite, and Nest CLI. |
| Unclear release features | Interim and Beta release milestones initially lacked explicit feature lists. | Kartik and Will | Finalizing specific lists of included features within the Project Schedule during Sprint 1\. |
| Development environment setup | Every team member must be able to build and run the code and all required tools on their own machine | Each team member | Each member will clone the repository and confirm that they can build and use all required tools. Not expected to be a large-scale obstacle. |
