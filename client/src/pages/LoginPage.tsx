import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FlaskConical, Smartphone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormData {
  phoneNumber: string;
  password: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { loginMutation } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      phoneNumber: '',
      password: ''
    }
  });

  const handleLogin = async (data: LoginFormData) => {
    console.log('=== UNIFIED LOGIN FORM SUBMIT ===');
    console.log('Login data:', data);
    
    // Clear previous errors
    setLoginError('');
    
    // Validate data
    if (!data.phoneNumber || !data.password) {
      setLoginError('Please fill in both phone number and password');
      return;
    }

    console.log('🔍 Login attempt for phone:', data.phoneNumber);
    
    loginMutation.mutate(data, {
      onSuccess: (data) => {
        console.log('🎉 Login successful, user role:', data?.user?.role);
        form.reset();
        setLoginError('');
        
        // Redirect based on role
        if (data?.user?.role === 'teacher') {
          console.log('Redirecting to teacher dashboard...');
          setLocation('/teacher');
        } else if (data?.user?.role === 'student') {
          console.log('Redirecting to student dashboard...');
          setLocation('/student');
        } else {
          console.log('Redirecting to home...');
          setLocation('/');
        }
      },
      onError: (error: any) => {
        console.error('❌ Login mutation error:', error);
        const message = error?.message || 'Invalid phone number or password. Please try again.';
        setLoginError(message.replace(/^(401: |400: |500: )/g, ''));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/15 rounded-full blur-xl"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-yellow-500/12 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-8 w-12 h-12 bg-blue-400/15 rounded-full blur-lg"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 rounded-3xl shadow-xl">
              <Smartphone className="w-10 h-10 text-blue-900" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 hero-title">
            Student Nursing Center
          </h1>
          <p className="text-yellow-300 text-xl font-semibold hero-subtitle">
            by Golam Sarowar Sir
          </p>
        </div>

        {/* Enhanced Login Card */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl rounded-3xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-3xl text-blue-900 font-bold">Login</CardTitle>
            <CardDescription className="text-blue-700 text-lg font-medium">
              Enter your phone number and password to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 text-base font-semibold">Phone Number</FormLabel>
                      <FormControl>
                        <input 
                          type="text"
                          placeholder="Enter your phone number" 
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="flex h-14 w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-lg text-blue-900 placeholder:text-blue-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 focus:outline-none shadow-md transition-all"
                          data-testid="input-phone"
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 text-base font-semibold">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="flex h-14 w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 pr-14 text-lg text-blue-900 placeholder:text-blue-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 focus:outline-none shadow-md transition-all"
                            data-testid="input-password"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Eye className="h-6 w-6 text-blue-600" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message Display */}
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm text-center">{loginError}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full h-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-700 font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="login-submit"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <button 
                onClick={() => setLocation('/')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
