'use client';

import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { testConnection } from '@/lib/supabaseClient';

const SupabaseStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const status = await testConnection();
      setIsConnected(status);
    } catch (err: unknown) {
      console.error('Connection check failed:', err);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      checkConnection();
    }
  }, []);

  if (isConnected === null && !isChecking) {
    return null; // Don't show anything during initial load
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Supabase Configuration Missing</h3>
            <p className="text-sm text-red-700 mt-1">
              Please configure your Supabase environment variables in .env.local:
            </p>
            <ul className="text-xs text-red-600 mt-2 space-y-1">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-xs"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      isConnected 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isChecking ? (
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          
          <div>
            <h3 className={`text-sm font-semibold ${
              isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              Supabase {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Connection Failed'}
            </h3>
            <p className={`text-sm ${
              isConnected ? 'text-green-700' : 'text-red-700'
            }`}>
              {isChecking 
                ? 'Testing database connection...'
                : isConnected 
                  ? 'Database and real-time features are available'
                  : 'Please check your Supabase configuration'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="btn-secondary text-xs"
        >
          {isChecking ? 'Checking...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );
};

export default SupabaseStatus;