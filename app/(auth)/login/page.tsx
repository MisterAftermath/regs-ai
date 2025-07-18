'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession, status: sessionStatus } = useSession();

  console.log('[Login Page] Current state:', state);
  console.log('[Login Page] Session status:', sessionStatus);

  useEffect(() => {
    console.log('[Login Page] Effect triggered - state.status:', state.status);

    if (state.status === 'failed') {
      console.log('[Login Page] Login failed - showing error toast');
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      console.log('[Login Page] Invalid data - showing error toast');
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      console.log('[Login Page] Login successful - updating session');
      setIsSuccessful(true);

      // Add async handling with proper error catching
      (async () => {
        try {
          console.log('[Login Page] Calling updateSession...');
          await updateSession();
          console.log('[Login Page] Session updated, refreshing router...');
          router.refresh();
          console.log('[Login Page] Router refreshed, redirecting to home...');
          // Explicitly redirect to home page
          router.push('/');
        } catch (error) {
          console.error('[Login Page] Error during post-login flow:', error);
          toast({
            type: 'error',
            description:
              'Login successful but encountered an error. Please refresh the page.',
          });
        }
      })();
    }
  }, [state.status, router, updateSession]);

  const handleSubmit = (formData: FormData) => {
    console.log(
      '[Login Page] Form submitted with email:',
      formData.get('email'),
    );
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
