'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const router = useRouter();
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Handle retry countdown
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setTimeout(() => {
        setRetryAfter(retryAfter - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryAfter === 0) {
      setRetryAfter(null);
      setLoginError('');
    }
  }, [retryAfter]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(''); // Clear any previous errors
    
    try {
      console.log('Attempting login for:', data.email);
      const response = await apiClient.post('/auth/login', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      console.log('Login response:', response.data);
      if (response.data.success) {
        try {
          // Use auth context to store user and tokens
          login(response.data.data.user, {
            accessToken: response.data.data.accessToken,
            refreshToken: response.data.data.refreshToken,
          });
          
          toast.success(`Welcome back, ${response.data.data.user.name}!`);
          router.push('/dashboard');
        } catch (successError) {
          console.error('Error in success handling:', successError);
          setLoginError('Login successful but failed to redirect. Please refresh the page.');
          toast.error('Login successful but failed to redirect. Please refresh the page.');
        }
      } else {
        const errorMessage = response.data.message || response.data.error || 'Login failed';
        setLoginError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please provide both email and password.';
      } else if (error.response?.status === 429) {
        const retryAfterHeader = error.response.headers['retry-after'];
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader) : 900; // Default to 15 minutes
        
        errorMessage = `Too many login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`;
        setRetryAfter(retryAfterSeconds);
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error.response) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      console.log('Showing error message:', errorMessage);
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast.error('Google sign-in is temporarily disabled');
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={retryAfter !== null}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={retryAfter !== null}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          {loginError && (
            <div className={`p-4 text-sm border rounded-md ${
              retryAfter ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {retryAfter ? (
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${retryAfter ? 'text-orange-800' : 'text-red-800'}`}>
                    {retryAfter ? 'Rate Limited' : 'Login Failed'}
                  </p>
                  <p className={`mt-1 ${retryAfter ? 'text-orange-700' : 'text-red-700'}`}>
                    {loginError}
                  </p>
                  {retryAfter && (
                    <div className="mt-2">
                      <p className="text-orange-600 text-xs">
                        You can try again in: {Math.floor(retryAfter / 60)}:{(retryAfter % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}
                  {loginError.includes('No account found') && !retryAfter && (
                    <div className="mt-2">
                      <p className="text-red-600 text-xs">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="underline hover:text-red-800">
                          Sign up here
                        </Link>
                      </p>
                    </div>
                  )}
                  {loginError.includes('Incorrect password') && !retryAfter && (
                    <div className="mt-2">
                      <p className="text-red-600 text-xs">
                        Forgot your password?{' '}
                        <button 
                          type="button"
                          className="underline hover:text-red-800"
                          onClick={() => toast.info('Password reset feature coming soon!')}
                        >
                          Reset password
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || retryAfter !== null}
          >
            {isLoading ? 'Signing in...' : retryAfter ? 'Rate Limited' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button"
            className="text-sm text-muted-foreground hover:text-primary underline"
            onClick={() => toast.info('Password reset feature coming soon!')}
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}




