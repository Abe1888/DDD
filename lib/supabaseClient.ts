import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.');
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.');
}

// Create Supabase client with fallback for missing env vars
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-client-info': 'gps-tracking-dashboard@1.0.0'
      }
    }
  }
);

// Test connection function with proper error handling
export const testConnection = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.info('Supabase connection successful');
    return true;
  } catch (error) {
    console.warn('Supabase connection failed:', error);
    return false;
  }
};

// Server-side data fetching functions
export const fetchVehiclesServer = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured for server-side fetching');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('day', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles:', error.message);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    console.error('Server-side vehicle fetch error:', error);
    throw error;
  }
};

export const fetchLocationsServer = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured for server-side fetching');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error.message);
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    console.error('Server-side location fetch error:', error);
    throw error;
  }
};

export const fetchTeamMembersServer = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured for server-side fetching');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error.message);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    console.error('Server-side team members fetch error:', error);
    throw error;
  }
};

export const fetchTasksServer = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured for server-side fetching');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error.message);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    console.error('Server-side tasks fetch error:', error);
    throw error;
  }
};