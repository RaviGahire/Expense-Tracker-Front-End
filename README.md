# FinTrack — Personal Expense & Wealth Tracker

A full-stack personal finance management application built with **React + TypeScript (Vite)** on the frontend and **Node.js + Express + MongoDB** on the backend. It replaces local/mock data with a secure, JWT-authenticated REST API (`/api/v1`) to track accounts, categories, transactions, monthly budgets, savings goals, recurring schedules, and financial analytics in real time.

---

## 1. Project Description

FinTrack helps users manage their complete financial lifecycle from a single dashboard:
- **Multi-Account Management:** Track balances and credit limits across Bank Accounts, Cash, Credit Cards, Digital Wallets (UPI), and High-Yield Savings, including inter-account transfers.
- **Income & Expense Ledger:** Log, filter, edit, and attach receipts to transactions with automatic resolution of account and category references.
- **Smart Budgets:** Set monthly, weekly, or yearly spending limits per category with customizable alert thresholds and one-click previous-month rollover.
- **Savings Goals:** Create prioritized savings targets, log incremental contributions, and automatically track completion progress.
- **Recurring Schedules:** Automate daily, weekly, biweekly, monthly, or yearly bills and income streams.
- **Live Analytics & Dashboard:** View net balance, monthly income vs. expenses, savings rate, category spending breakdowns, and 6-month cashflow trends.

---

## 2. How the Project Works (Step-by-Step Architecture)

1. **Authentication & Session Layer (`authService` & `apiClient`):**
   - Users register or log in via `/api/v1/auth/register` or `/api/v1/auth/login`.
   - The returned JWT is stored in `localStorage` (`expense_tracker_token`).
   - All feature services route HTTP requests through a single centralized `apiRequest` client (`src/services/apiClient.ts`), which automatically injects `Authorization: Bearer <token>`, handles JSON and `FormData` payloads, and redirects to `/login` on `401 Unauthorized` responses.

2. **Reference & Schema Normalization:**
   - **Accounts (`accountService`):** Maps frontend account types (e.g., `credit_card` $\leftrightarrow$ `credit`) and routes account transfers through `POST /api/v1/transactions` (`type: 'transfer'`).
   - **Categories (`categoryService`):** Normalizes category names/labels and MongoDB `_id` references across transactions, budgets, and recurring rules.
   - **Transactions (`transactionService`):** Automatically resolves user-selected payment methods and category names to valid MongoDB `accountId` and `categoryId` ObjectIds before submitting to `/api/v1/transactions`.
   - **Budgets (`budgetService`):** Converts `"YYYY-MM"` strings into numeric `{ month, year }` fields for backend validation and auto-creates missing categories if needed.
   - **Goals & Recurring Rules (`goalService`, `recurringService`):** Sync goal contributions (`POST /api/v1/goals/:id/contributions`) and advance recurring next-run dates (`PATCH /api/v1/recurring/:id`).

3. **Dashboard & Analytics Aggregation (`dashboardService`):**
   - Fetches live balances, period-filtered transactions, active budgets, and 6-month cashflow trends to compute real-time KPIs and spending progress.

---

## 3. Step-by-Step Setup & Running Guide

### Step 1: Clone & Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the **backend** directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the **frontend** directory:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Step 3: Start Development Servers
```bash
# Terminal 1 — Run Backend API
cd server
npm run dev

# Terminal 2 — Run Frontend Vite App
cd client
npm run dev
```

### Step 4: Build for Production
```bash
# Build backend TypeScript
cd server
npm run build

# Build frontend production bundle
cd client
npm run build
```

---

## 4. Format & Lint Commands

Use the following commands to format code with Prettier and check linting/type safety:

```bash
# Format all files with Prettier
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

# Check formatting without modifying files
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"

# Run ESLint
npm run lint

# Run TypeScript type check
npx tsc --noEmit
```

---

## 5. Test Commands

Use the following commands to execute unit, integration, and API tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npx vitest run src/features/transactions/services/transactionService.test.ts
```

---

## 6. Folder Structure

```text
expense-tracker-client/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.jsx                       # Root component
│   │   ├── router.jsx                    # All routes (createBrowserRouter)
│   │   └── providers.jsx                 # Auth, Toast, Accounts, Categories, Budget
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx    # Route guard
│   │   │   ├── context/AuthContext.jsx   # user, token, login, logout, registers 401 handler
│   │   │   ├── hooks/useAuth.js
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── services/authService.js
│   │   │   ├── schemas/authSchema.js     # Zod
│   │   │   └── __tests__/LoginForm.test.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── SummaryCards.jsx          # balance, income, expenses
│   │   │   │   ├── BudgetProgressCard.jsx    # budget, remaining, % used
│   │   │   │   ├── RecentTransactions.jsx    # same endpoint, limit=10
│   │   │   │   ├── IncomeExpenseChart.jsx
│   │   │   │   └── QuickAddButton.jsx
│   │   │   ├── hooks/useDashboard.js
│   │   │   ├── pages/DashboardPage.jsx
│   │   │   └── services/dashboardService.js
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   │   ├── TransactionForm.jsx       # add/edit, date defaults to today
│   │   │   │   ├── RecurringFields.jsx       # toggle, frequency, next date (inside form)
│   │   │   │   ├── AttachmentUpload.jsx      # size/type check, multipart
│   │   │   │   ├── TransactionModal.jsx
│   │   │   │   ├── TransactionList.jsx
│   │   │   │   ├── TransactionItem.jsx       # icon, category, note, date, account, amount
│   │   │   │   ├── TransactionFilters.jsx    # type, category, account, dates, amount
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   └── ExportCsvButton.jsx       # uses the active filters
│   │   │   ├── hooks/
│   │   │   │   ├── useTransactions.js        # server-side page, limit, filters
│   │   │   │   └── useTransactionFilters.js  # synced with URL (useSearchParams)
│   │   │   ├── pages/TransactionsPage.jsx
│   │   │   ├── services/transactionService.js
│   │   │   ├── schemas/transactionSchema.js  # includes file and recurring rules
│   │   │   └── __tests__/
│   │   │       ├── TransactionForm.test.jsx
│   │   │       └── TransactionList.test.jsx
│   │   │
│   │   ├── categories/
│   │   │   ├── components/
│   │   │   │   ├── CategorySelect.jsx
│   │   │   │   ├── CategoryManager.jsx       # create/delete custom categories
│   │   │   │   └── CategoryIcon.jsx          # fallback icon for custom ones
│   │   │   ├── constants/categoryIcons.js    # icon map only
│   │   │   ├── context/CategoriesContext.jsx # defaults + custom from API, refresh()
│   │   │   ├── hooks/useCategories.js
│   │   │   ├── services/categoryService.js
│   │   │   └── schemas/categorySchema.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── PeriodSwitcher.jsx        # Week | Month | 3 Months | Year
│   │   │   │   ├── MonthlyStatsCards.jsx     # income, expenses, net savings
│   │   │   │   ├── CategoryDonutChart.jsx
│   │   │   │   └── SpendingTrendChart.jsx    # bar/line
│   │   │   ├── hooks/useAnalytics.js
│   │   │   ├── pages/AnalyticsPage.jsx
│   │   │   └── services/analyticsService.js
│   │   │
│   │   ├── accounts/
│   │   │   ├── components/
│   │   │   │   ├── AccountCard.jsx
│   │   │   │   ├── AccountList.jsx
│   │   │   │   ├── AccountForm.jsx           # Cash, Bank, Credit Card, Wallet, Savings
│   │   │   │   └── TotalBalanceCard.jsx
│   │   │   ├── context/AccountsContext.jsx   # balances, refresh()
│   │   │   ├── hooks/useAccounts.js
│   │   │   ├── pages/AccountsPage.jsx
│   │   │   ├── services/accountService.js
│   │   │   └── schemas/accountSchema.js
│   │   │
│   │   ├── budgets/
│   │   │   ├── components/
│   │   │   │   ├── BudgetForm.jsx
│   │   │   │   ├── BudgetProgressBar.jsx
│   │   │   │   ├── BudgetWarningBanner.jsx   # 50 / 75 / 90 / 100%+ messages
│   │   │   │   └── CategoryBudgetList.jsx    # advanced
│   │   │   ├── context/BudgetContext.jsx     # current budget + usage, refresh()
│   │   │   ├── utils/getBudgetWarning.js     # pure threshold logic (unit test it)
│   │   │   ├── hooks/useBudgets.js
│   │   │   ├── pages/BudgetsPage.jsx
│   │   │   ├── services/budgetService.js
│   │   │   └── schemas/budgetSchema.js
│   │   │
│   │   ├── recurring/
│   │   │   ├── components/
│   │   │   │   ├── RecurringList.jsx
│   │   │   │   ├── RecurringItem.jsx         # pause / resume / delete
│   │   │   │   └── FrequencyBadge.jsx
│   │   │   ├── hooks/useRecurring.js
│   │   │   ├── pages/RecurringPage.jsx
│   │   │   └── services/recurringService.js
│   │   │
│   │   └── goals/
│   │       ├── components/
│   │       │   ├── GoalCard.jsx              # target, saved, % progress
│   │       │   ├── GoalForm.jsx
│   │       │   ├── GoalList.jsx
│   │       │   └── AddFundsModal.jsx
│   │       ├── hooks/useGoals.js
│   │       ├── pages/GoalsPage.jsx
│   │       ├── services/goalService.js
│   │       
│   │
│   ├── components/                           # Shared, reusable UI
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Navbar.jsx                    # includes logout
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx             # shared delete confirmation
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── ProgressBar.jsx
│   │   └── feedback/
│   │       ├── Loader.jsx                    # loading state
│   │       ├── EmptyState.jsx                # empty state
│   │       ├── ErrorState.jsx                # error state with retry
│   │       ├── ErrorBoundary.jsx
│   │       └── Toast.jsx
│   │
│   ├── context/
│   │   └── ToastContext.jsx
│   │
│   ├── hooks/
│   │   └── useDebounce.js                    # search input
│   │
│   ├── lib/
│   │   ├── axiosInstance.js                  # baseURL, token, 401 callback
│   │   └── queryParams.js                    # builds filter query strings
│   │
│   ├── utils/
│   │   ├── formatCurrency.js                 # reads CURRENCY from config
│   │   ├── formatDate.js                     # includes getTodayLocal()
│   │   ├── downloadFile.js                   # CSV blob download
│   │   └── tokenStorage.js
│   │
│   ├── constants/
│   │   ├── config.js                         # CURRENCY, LOCALE, PAGE_SIZE
│   │   ├── routes.js
│   │   ├── accountTypes.js
│   │   └── periods.js
│   │
│   ├── assets/
│   ├── styles/index.css                      # @import "tailwindcss";
│   ├── pages/NotFoundPage.jsx
│   ├── test/
│   │   ├── setupTests.js
│   │   └── testUtils.jsx                     # render with providers + router
│   └── main.jsx
│
├── index.html                                # Vite entry (project root)
├── .env.example                              # VITE_API_URL=
├── .gitignore                                # must include .env
├── .prettierrc
├── eslint.config.js
├── jsconfig.json                             # "@/*" -> "src/*"
├── vercel.json                               # SPA rewrite (or public/_redirects for Netlify)
├── vite.config.js                            # react, tailwind plugin, alias, vitest
├── package.json
└── README.md
```




```

## API Endpoints

* **Auth** (`/api/v1/auth`)
  * `POST /api/v1/auth/register`
  * `POST /api/v1/auth/login`
  * `GET /api/v1/auth/me`
  * `PATCH /api/v1/auth/me`

* **Accounts** (`/api/v1/accounts`)
  * `GET /api/v1/accounts`
  * `POST /api/v1/accounts`
  * `GET /api/v1/accounts/:id`
  * `PATCH /api/v1/accounts/:id`
  * `DELETE /api/v1/accounts/:id`

* **Categories** (`/api/v1/categories`)
  * `GET /api/v1/categories`
  * `POST /api/v1/categories`
  * `GET /api/v1/categories/:id`
  * `PATCH /api/v1/categories/:id`
  * `DELETE /api/v1/categories/:id`

* **Transactions** (`/api/v1/transactions`)
  * `GET /api/v1/transactions` *(paginated + filtered)*
  * `POST /api/v1/transactions`
  * `GET /api/v1/transactions/:id`
  * `PATCH /api/v1/transactions/:id`
  * `DELETE /api/v1/transactions/:id`

* **Budgets** (`/api/v1/budgets`)
  * `GET /api/v1/budgets`
  * `POST /api/v1/budgets`
  * `GET /api/v1/budgets/:id`
  * `PATCH /api/v1/budgets/:id`
  * `DELETE /api/v1/budgets/:id`

* **Goals** (`/api/v1/goals`)
  * `GET /api/v1/goals`
  * `POST /api/v1/goals`
  * `PATCH /api/v1/goals/:id`
  * `POST /api/v1/goals/:id/contribute`
  * `DELETE /api/v1/goals/:id`

* **Recurring** (`/api/v1/recurring`)
  * `GET /api/v1/recurring`
  * `POST /api/v1/recurring`
  * `PATCH /api/v1/recurring/:id`
  * `POST /api/v1/recurring/:id/execute`
  * `DELETE /api/v1/recurring/:id`

* **Analytics** (`/api/v1/analytics`)
  * `GET /api/v1/analytics/summary`
  * `GET /api/v1/analytics/categories`
  * `GET /api/v1/analytics/trends`
