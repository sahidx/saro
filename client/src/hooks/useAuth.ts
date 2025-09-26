import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";

export function useAuth() {
  // Fetch current user from session-based API with faster retry
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    queryFn: getQueryFn({ on401: "returnNull" }), // Return null on 401 instead of throwing
  });

  // Development mode mock user when backend is unavailable
  const isDevelopment = process.env.NODE_ENV === 'development';
  const mockUser = isDevelopment && error && !user ? {
    id: 'teacher-mock-dev',
    firstName: 'Golam Sarowar',
    lastName: 'Sir',
    phoneNumber: '01762602056',
    role: 'teacher',
    email: null,
    smsCredits: 1000,
    isActive: true
  } : null;

  const finalUser = user || mockUser;
  const isAuthenticated = !!finalUser;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { phoneNumber: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
      throw error;
    },
  });

  // Logout mutation - improved cleanup
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Starting logout process...');
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      console.log('✅ Logout API successful');
      // Clear ALL query cache to prevent stale data
      queryClient.clear();
      // Redirect to home
      window.location.replace('/');
    },
    onError: (error) => {
      console.error('❌ Logout API failed:', error);
      // Clear cache anyway and redirect
      queryClient.clear();
      window.location.replace('/');
    },
  });

  const login = async (credentials: { phoneNumber: string; password: string }) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  return {
    user: finalUser,
    isLoading: isLoading && !mockUser, // Don't show loading if we have mock user
    isAuthenticated,
    login,
    logout,
    loginMutation,
    logoutMutation,
  };
}
