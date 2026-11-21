import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
    IconWallet,
    IconMenu2,
    IconX,
    IconLayoutDashboard,
    IconReceipt,
    IconTag,
    IconPigMoney,
    IconChartBar,
    IconSettings,
    IconLogout,
    IconRepeat,
    IconTargetArrow,
} from "@tabler/icons-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth";
import { ConfirmDialog } from "../ui/ConfirmDialog";

// Navigation links mapping
const NAV_LINKS = [
    { path: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
    { path: "/transactions", label: "Transactions", icon: IconReceipt },
    { path: "/categories", label: "Categories", icon: IconTag },
    { path: "/budgets", label: "Budgets", icon: IconPigMoney },
    { path: "/analytics", label: "Analytics", icon: IconChartBar },
    { path: '/recurring', label: 'Recurring', icon: IconRepeat },
    { path: '/goals', label: 'Goals', icon: IconTargetArrow },
];

export const Navbar = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    // Authentication state
    const { user, isAuthenticated, logout } = useAuth();

    // Handle logout
    const openLogoutDialog = () => {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
        setLogoutDialogOpen(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setLogoutDialogOpen(false);
        navigate("/login");
    };

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-subtle bg-canvas/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Brand Logo */}
                        <Link to="/" className="group flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors duration-200 group-hover:bg-brand/20">
                                <IconWallet className="h-6 w-6" stroke={2} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-ink-primary">
                                Expense<span className="text-brand">Tracker</span>
                            </span>
                        </Link>

                        {/* Desktop NavLinks */}
                        <div className="hidden items-center gap-1 md:flex">
                            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
                                <NavLink
                                    key={path}
                                    to={path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                                            isActive
                                                ? "bg-brand/10 text-brand"
                                                : "text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                                        }`
                                    }
                                >
                                    <Icon className="h-4 w-4" stroke={1.75} />
                                    {label}
                                </NavLink>
                            ))}
                        </div>

                        {/* Auth Actions / User Menu */}
                        <div className="hidden items-center gap-4 md:flex">
                            {isAuthenticated ? (
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        onClick={() => setProfileDropdownOpen((prev) => !prev)}
                                        onBlur={() =>
                                            setTimeout(() => setProfileDropdownOpen(false), 200)
                                        }
                                        className="h-auto gap-2.5 rounded-full bg-surface p-1 pr-3.5"
                                    >
                                        <img
                                            src={user?.avatar}
                                            alt={user?.name}
                                            className="h-8 w-8 rounded-full border border-brand/50 object-cover"
                                        />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-xs font-semibold leading-tight text-ink-primary">
                                                {user?.name}
                                            </span>
                                            <span className="text-[10px] leading-tight text-ink-muted">
                                                Member
                                            </span>
                                        </div>
                                    </Button>

                                    {profileDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-subtle bg-surface p-1.5 shadow-2xl">
                                            <div className="mb-1 border-b border-subtle px-3 py-2">
                                                <p className="text-sm font-semibold text-ink-primary">
                                                    {user?.name}
                                                </p>
                                                <p className="truncate text-xs text-ink-muted">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            {/* Settings Btn */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate("/settings")}
                                                leftIcon={
                                                    <IconSettings
                                                        className="h-4 w-4"
                                                        stroke={1.75}
                                                    />
                                                }
                                                className="w-full justify-start text-sm font-normal"
                                            >
                                                Settings
                                            </Button>

                                            {/* Log out Btn */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={openLogoutDialog}
                                                leftIcon={
                                                    <IconLogout className="h-4 w-4" stroke={1.75} />
                                                }
                                                className="mt-1 w-full justify-start text-sm font-normal text-expense hover:bg-expense/10 hover:text-expense"
                                            >
                                                Log out
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/login"
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas shadow-md shadow-brand/10 transition-colors hover:bg-brand-hover"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Toggle navigation menu"
                                onClick={() => setMobileMenuOpen((prev) => !prev)}
                            >
                                {mobileMenuOpen ? (
                                    <IconX className="h-6 w-6" stroke={2} />
                                ) : (
                                    <IconMenu2 className="h-6 w-6" stroke={2} />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Responsive Drawer + Backdrop */}
                {mobileMenuOpen && (
                    <>
                        {/* Dimmed Backdrop */}
                        <div
                            aria-hidden="true"
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 top-16 z-40 bg-canvas/70 backdrop-blur-xs md:hidden"
                        />

                        {/* Positioned Overlay Menu */}
                        <div className="absolute inset-x-0 top-16 z-50 border-b border-subtle bg-surface shadow-2xl md:hidden">
                            <div className="space-y-1 px-4 py-3">
                                {NAV_LINKS.map(({ path, label, icon: Icon }) => (
                                    <NavLink
                                        key={path}
                                        to={path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                                                isActive
                                                    ? "bg-brand/15 text-brand"
                                                    : "text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                                            }`
                                        }
                                    >
                                        <Icon className="h-5 w-5" stroke={1.75} />
                                        {label}
                                    </NavLink>
                                ))}
                            </div>

                            <div className="border-t border-subtle px-4 py-4">
                                {isAuthenticated ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user?.avatar}
                                                alt={user?.name}
                                                className="h-10 w-10 rounded-full border border-brand object-cover"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-ink-primary">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-ink-muted">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Settings Btn */}
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    navigate("/settings");
                                                }}
                                                leftIcon={
                                                    <IconSettings
                                                        className="h-4 w-4"
                                                        stroke={1.75}
                                                    />
                                                }
                                                className="bg-surface-elevated text-ink-secondary"
                                            >
                                                Settings
                                            </Button>

                                            {/* Logout Btn */}
                                            <Button
                                                variant="danger"
                                                onClick={openLogoutDialog}
                                                leftIcon={
                                                    <IconLogout className="h-4 w-4" stroke={1.75} />
                                                }
                                            >
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            to="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex justify-center rounded-lg border border-subtle py-2.5 text-base font-medium text-ink-primary hover:bg-surface-elevated"
                                        >
                                            Log In
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex justify-center rounded-lg bg-brand py-2.5 text-base font-semibold text-canvas hover:bg-brand-hover"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
                isOpen={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Log out"
                message="Are you sure you want to log out of your account?"
                confirmText="Log out"
                cancelText="Stay logged in"
            />
        </>
    );
};