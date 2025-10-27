import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// Load environment variables from .env.local file
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Database connection successful!');
    console.log('Connected to Supabase project:', supabaseUrl);
  } catch (error) {
    console.error('❌ Database connection failed!', error);
  }
}

runTest();