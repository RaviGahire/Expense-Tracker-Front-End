import { BrowserRouter } from "react-router-dom";
import { Navbar } from "../components";
import { AppRouter } from "./router";
import { AuthProvider } from "../features/auth";
import { CategoriesProvider } from "../features/categories";
export const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen bg-canvas text-ink-primary">
                    <Navbar />
                    <CategoriesProvider>
                        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <AppRouter />
                        </main>
                    </CategoriesProvider>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};
