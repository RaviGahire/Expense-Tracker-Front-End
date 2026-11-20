import { Routes, Route, Navigate } from "react-router-dom";
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
            <Route path="/transactions" element={<PlaceholderPage title="Transactions" />} />
            <Route path="/budgets" element={<PlaceholderPage title="Budgets" />} />
            <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="/login" element={<PlaceholderPage title="Log In" />} />
            <Route path="/register" element={<PlaceholderPage title="Register" />} />
            <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" />} />
        </Routes>
    );
};
