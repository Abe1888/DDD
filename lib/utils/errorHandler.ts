/**
 * Centralized error handling utilities for the application
 */

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export const createAppError = (message: string, code?: string, details?: unknown): AppError => ({
  message,
  code,
  details,
});

export const handleSupabaseError = (error: unknown): AppError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return createAppError(
      `Database error: ${(error as any).message}`,
      (error as any).code,
      error
    );
  }
  
  if (error instanceof Error) {
    return createAppError(error.message, 'UNKNOWN_ERROR', error);
  }
  
  return createAppError('An unknown database error occurred', 'UNKNOWN_ERROR', error);
};

export const handleNetworkError = (error: unknown): AppError => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createAppError(
      'Network connection failed. Please check your internet connection.',
      'NETWORK_ERROR',
      error
    );
  }
  
  return handleSupabaseError(error);
};

export const logError = (context: string, error: unknown) => {
  const appError = error instanceof Error ? error : handleSupabaseError(error);
  console.error(`[${context}]`, appError);
};

export const isSupabaseConfigured = (): boolean => {
  try {
    // Only check on client side to prevent hydration issues
    if (typeof window === 'undefined') {
      return true; // Assume configured on server side
    }
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return !!(url && key && url !== 'your_supabase_url_here' && key !== 'your_supabase_anon_key_here');
  } catch (error) {
    console.warn('Error checking Supabase configuration:', error);
    return false;
  }
};