/**
 * Modern Education Theme Configuration
 * Professional color scheme for educational coaching management system
 */

export const modernTheme = {
  colors: {
    // Primary brand colors - Professional Purple
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    
    // Secondary colors - Neutral grays
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Success colors - Modern green
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning colors - Modern amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error colors - Modern red
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Info colors - Modern blue
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    }
  },
  
  // Component-specific color utilities
  components: {
    card: {
      light: 'bg-white border-gray-200 shadow-sm',
      dark: 'bg-gray-900 border-gray-800 shadow-lg'
    },
    
    button: {
      primary: {
        light: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl',
        dark: 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
      },
      secondary: {
        light: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
        dark: 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700'
      }
    },
    
    input: {
      light: 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500',
      dark: 'bg-gray-800 border-gray-700 focus:border-purple-400 focus:ring-purple-400 text-white'
    },
    
    badge: {
      success: {
        light: 'bg-green-100 text-green-800 border-green-200',
        dark: 'bg-green-900/30 text-green-400 border-green-800'
      },
      warning: {
        light: 'bg-amber-100 text-amber-800 border-amber-200',
        dark: 'bg-amber-900/30 text-amber-400 border-amber-800'
      },
      error: {
        light: 'bg-red-100 text-red-800 border-red-200',
        dark: 'bg-red-900/30 text-red-400 border-red-800'
      },
      info: {
        light: 'bg-blue-100 text-blue-800 border-blue-200',
        dark: 'bg-blue-900/30 text-blue-400 border-blue-800'
      }
    }
  },
  
  // Gradient utilities
  gradients: {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-800',
    primarySubtle: 'bg-gradient-to-r from-purple-50 to-purple-100',
    primaryDark: 'bg-gradient-to-r from-purple-900 to-purple-800',
    
    success: 'bg-gradient-to-r from-green-600 to-emerald-600',
    successSubtle: 'bg-gradient-to-r from-green-50 to-emerald-50',
    
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
    warningSubtle: 'bg-gradient-to-r from-amber-50 to-orange-50',
    
    error: 'bg-gradient-to-r from-red-600 to-rose-600',
    errorSubtle: 'bg-gradient-to-r from-red-50 to-rose-50',
  }
};

// Theme utility functions
export const getThemeClass = (component: keyof typeof modernTheme.components, variant: string, isDarkMode: boolean) => {
  const componentTheme = modernTheme.components[component] as any;
  if (componentTheme && componentTheme[variant]) {
    return isDarkMode ? componentTheme[variant].dark : componentTheme[variant].light;
  }
  return '';
};

export const getBadgeClass = (type: 'success' | 'warning' | 'error' | 'info', isDarkMode: boolean) => {
  return getThemeClass('badge', type, isDarkMode);
};

export const getCardClass = (isDarkMode: boolean) => {
  return getThemeClass('card', '', isDarkMode);
};

export const getButtonClass = (variant: 'primary' | 'secondary', isDarkMode: boolean) => {
  return getThemeClass('button', variant, isDarkMode);
};

export const getInputClass = (isDarkMode: boolean) => {
  return getThemeClass('input', '', isDarkMode);
};
