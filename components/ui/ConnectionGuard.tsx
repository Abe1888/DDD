'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/utils/errorHandler';

interface ConnectionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ children, fallback }) => {
  const [isConfigured, setIsConfigured] = React.useState<boolean | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);
  
  React.useEffect(() => {
    // Check configuration on client side only
    if (typeof window !== 'undefined') {
      const checkConfig = () => {
        try {
          const configured = isSupabaseConfigured();
          setIsConfigured(configured);
        } catch (error) {
          console.error('Error checking Supabase configuration:', error);
          setIsConfigured(false);
        } finally {
          setIsChecking(false);
        }
      };
      
      // Small delay to prevent hydration issues
      const timer = setTimeout(checkConfig, 100);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Show loading state during initial check
  if (isChecking || isConfigured === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-lg w-full text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Initializing Application</h2>
          <p className="text-sm text-slate-600">Checking database configuration...</p>
        </div>
      </div>
    );
  }

  if (isConfigured === false) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-lg w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Database Configuration Required</h2>
            <p className="text-sm text-slate-600 mb-6">
              To use this application, you need to configure your Supabase database connection.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Required Environment Variables:</h3>
              <div className="space-y-1 text-xs font-mono text-slate-700">
                <div>NEXT_PUBLIC_SUPABASE_URL=your_project_url</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                1. Create a Supabase project at{' '}
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  supabase.com
                </a>
              </p>
              <p className="text-sm text-slate-600">
                2. Copy your project URL and anon key from Settings → API
              </p>
              <p className="text-sm text-slate-600">
                3. Add them to your .env.local file
              </p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center space-x-2 mx-auto mt-6"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload After Setup</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ConnectionGuard;