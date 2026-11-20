import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm, type LoginFormValues } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setServerError(null);
      await login(values);
      navigate('/dashboard');
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6">
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        serverError={serverError}
      />
    </section>
  );
}