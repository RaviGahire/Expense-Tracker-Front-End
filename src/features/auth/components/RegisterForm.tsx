import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
    IconUser,
    IconMail,
    IconLock,
    IconEye,
    IconEyeOff,
    IconCurrencyRupee,
    IconAlertCircle,
} from "@tabler/icons-react";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { SelectInput } from "../../../components/ui/SelectInput";
import { Button } from "../../../components/ui/Button";

export interface RegisterFormValues {
    name: string;
    email: string;
    currency: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterFormProps {
    onSubmit?: (values: Omit<RegisterFormValues, "confirmPassword">) => Promise<void> | void;
    isLoading?: boolean;
    serverError?: string | null;
}

type FormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const CURRENCY_OPTIONS = [
    { value: "INR", label: "INR (₹) - Indian Rupee" },
    { value: "USD", label: "USD ($) - US Dollar" },
    { value: "EUR", label: "EUR (€) - Euro" },
    { value: "GBP", label: "GBP (£) - British Pound" },
];

export const RegisterForm = ({
    onSubmit,
    isLoading = false,
    serverError = null,
}: RegisterFormProps) => {
    const [values, setValues] = useState<RegisterFormValues>({
        name: "",
        email: "",
        currency: "INR",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear field-level error as the user fixes it
        if (errors[name as keyof RegisterFormValues]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};

        if (!values.name.trim()) {
            nextErrors.name = "Full name is required.";
        } else if (values.name.trim().length < 2) {
            nextErrors.name = "Name must be at least 2 characters.";
        }

        if (!values.email.trim()) {
            nextErrors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
            nextErrors.email = "Please enter a valid email address.";
        }

        if (!values.password) {
            nextErrors.password = "Password is required.";
        } else if (values.password.length < 8) {
            nextErrors.password = "Password must be at least 8 characters.";
        }

        if (!values.confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your password.";
        } else if (values.confirmPassword !== values.password) {
            nextErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            currency: values.currency,
            password: values.password,
        };

        if (onSubmit) {
            await onSubmit(payload);
        } else {
            console.log("Register payload ready:", payload);
        }
    };

    return (
        <Card className="w-full max-w-md p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
                    Create your account
                </h1>
                <p className="mt-1.5 text-sm text-ink-secondary">
                    Start tracking expenses, setting budgets, and growing savings.
                </p>
            </div>

            {/* API / Server Error Banner */}
            {serverError && (
                <div
                    role="alert"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-expense/30 bg-expense/10 p-3.5 text-xs text-expense"
                >
                    <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" stroke={2} />
                    <span>{serverError}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ravi Gahire"
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name}
                    disabled={isLoading}
                    leftIcon={<IconUser className="h-4 w-4" stroke={1.75} />}
                />

                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={isLoading}
                    leftIcon={<IconMail className="h-4 w-4" stroke={1.75} />}
                />

                <SelectInput
                    label="Default Currency"
                    name="currency"
                    value={values.currency}
                    onChange={handleChange}
                    options={CURRENCY_OPTIONS}
                    disabled={isLoading}
                    leftIcon={<IconCurrencyRupee className="h-4 w-4" stroke={1.75} />}
                    helperText="Used across your dashboard, budgets, and reports."
                />

                <Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={values.password}
                    onChange={handleChange}
                    error={errors.password}
                    disabled={isLoading}
                    leftIcon={<IconLock className="h-4 w-4" stroke={1.75} />}
                    rightIcon={
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="text-ink-muted transition-colors hover:text-ink-primary focus:outline-none"
                        >
                            {showPassword ? (
                                <IconEyeOff className="h-4 w-4" stroke={1.75} />
                            ) : (
                                <IconEye className="h-4 w-4" stroke={1.75} />
                            )}
                        </button>
                    }
                />

                <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    disabled={isLoading}
                    leftIcon={<IconLock className="h-4 w-4" stroke={1.75} />}
                    rightIcon={
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                            }
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="text-ink-muted transition-colors hover:text-ink-primary focus:outline-none"
                        >
                            {showConfirmPassword ? (
                                <IconEyeOff className="h-4 w-4" stroke={1.75} />
                            ) : (
                                <IconEye className="h-4 w-4" stroke={1.75} />
                            )}
                        </button>
                    }
                />

                <Button type="submit" size="lg" isLoading={isLoading} className="mt-2 w-full">
                    Create Account
                </Button>
            </form>

            {/* Footer Link */}
            <p className="mt-6 text-center text-sm text-ink-secondary">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-brand transition-colors hover:text-brand-hover"
                >
                    Log in
                </Link>
            </p>
        </Card>
    );
};
