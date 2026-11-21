import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage } from "../features/auth";
import { DashboardPage } from "../features/dashboard";
import { TransactionsPage } from "../features/transactions";
import { CategoriesPage } from "../features/categories";
import { BudgetsPage } from "../features/budgets";
import { RecurringPage } from "../features/recurring";
import { AnalyticsPage } from "../features/analytics";
import { GoalsPage } from "../features/goals";
import { AccountsPage } from "../features/accounts";
import { NotFoundPage } from "../pages/NotFoundPage";

export const AppRouter = () => {
    return (
        <Routes>
            {/* Dashboard Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Features Routes */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
