import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  RegisterForm,
  type RegisterFormValues,
} from '../components/RegisterForm';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleRegister = async (
    values: Omit<RegisterFormValues, 'confirmPassword'>
  ) => {
    try {
      setIsLoading(true);
      setServerError(null);
      await register(values);
      navigate('/dashboard');
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6">
      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        serverError={serverError}
      />
    </section>
  );
}