import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit?: (values: LoginFormValues) => Promise<void> | void;
  isLoading?: boolean;
  serverError?: string | null;
}

type FormErrors = Partial<Record<keyof LoginFormValues, string>>;

export const LoginForm = ({
  onSubmit,
  isLoading = false,
  serverError = null,
}: LoginFormProps) => {
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof LoginFormValues]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: LoginFormValues = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };

    if (onSubmit) {
      await onSubmit(payload);
    } else {
      console.log('Login payload ready:', payload);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Log in to review your expenses, budgets, and insights.
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

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isLoading}
          leftIcon={<IconLock className="h-4 w-4" stroke={1.75} />}
          rightIcon={
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="mt-2 w-full"
        >
          Log In
        </Button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-sm text-ink-secondary">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-brand transition-colors hover:text-brand-hover"
        >
          Create one
        </Link>
      </p>
    </Card>
  );
};