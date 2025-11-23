


### 🎯 Initial Features to Build

1. **Signup and Login Pages**

   * The **Login page** should include:

     * Email and password fields
     * “Remember me” checkbox
     * Login and Signup buttons
   * The **Signup page** should have a clean, standard registration form with no unnecessary extras — just the typical inputs for a good signup flow.

2. **Profile Setup Page(s)**

   * After the user logs in for the first time, they should be redirected to a **blurred Dashboard overlay** prompting them to “set up their profile for a tailored experience.”
   * The profile setup form will be based on **Dataset 1 features**, all of which are **manually entered** by the user.
   * The page should look **clean, friendly, and well-structured**, with intuitive form organization.
   * Once saved, redirect the user to the main dashboard.

3. **Home Page / Dashboard**

   * The Dashboard will act as the central hub of the app.
   * It should include a **navigation bar** with links to:

     * Dashboard (Home)
     * Add Expenses Page
     * Monthly Report Page
     * Edit Profile / Edit Account
     * Logout
   * The dashboard should later include **widgets and overview components** for income, expenses, savings, and health scores.
   * Until data exists, display **placeholder messages** (e.g., “Add expenses to unlock insights”) or blurred components.

4. **Add Expenses Page**

   * Based on **Dataset 2 features**, this page will allow users to manually input monthly spending data across categories.
   * The form should be **clear, structured, and user-friendly**, grouped logically by expense type.
   * Data will be stored in the database, and necessary aggregated values (totals, ratios, etc.) will be calculated automatically.

5. **Monthly Report Page**

   * Displays summarized results of all user data — income vs expenses, savings, ratios, and aggregated metrics.
   * Includes **graphs, pie charts, and percentage overviews** representing key financial insights.
   * The report should also show **aggregated values** derived from the three datasets, but only those relevant to the user’s view.

---

### 🗄️ Database Setup

Before starting anything, we’ll **set up the PostgreSQL database** to handle:

* User authentication data (signup/login)
* Profile data (Dataset 1)
* Expense data (Dataset 2)
* Aggregated and calculated data fields

The database structure should be designed first and then **synchronized across all team members’ environments** to maintain consistency during development.

- datasets are in the datasets folder, user_profile is dataset 1, monthly_spending is dataset2 2, financial_health_assessment is dataset 3

---

That’s the complete initial scope for now — this version is clear enough to guide development, align backend and frontend work, and make sure everyone knows what’s being built and in what order.
