import { BrowserRouter } from "react-router-dom";
import { Navbar } from "../components";
import { AppRouter } from "./router";
import { AuthProvider } from "../features/auth";
export const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen bg-canvas text-ink-primary">
                    <Navbar />
                    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <AppRouter />
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};
