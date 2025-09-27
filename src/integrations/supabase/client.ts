import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bgdiccnlhefqtzgygfaz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZGljY25saGVmcXR6Z3lnZmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTEzMzgsImV4cCI6MjA3NDUyNzMzOH0.fpVOmMyKfsiSckY2TCf1M-Tkx3zz0DlWPDrerPYbCXA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});