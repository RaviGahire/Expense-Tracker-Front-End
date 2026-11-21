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
import { PublicRoute } from "../features/auth/PublicRoute";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

export const AppRouter = () => {
    return (
        <Routes>
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                
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
                
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};
