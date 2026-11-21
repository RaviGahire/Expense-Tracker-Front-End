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
interface PlaceholderPageProps {
    title: string;
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
    return (
        <div className="rounded-2xl border border-subtle bg-surface p-8">
            <h1 className="text-2xl font-bold text-ink-primary">{title}</h1>
            <p className="mt-2 text-sm text-ink-secondary">{title} page is ready</p>
        </div>
    );
}

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

            <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" />} />
        </Routes>
    );
};
