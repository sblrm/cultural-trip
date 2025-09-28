import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function testDestinations() {
  console.log('Checking destinations in database...');
  
  try {
    const { data, error, count } = await supabase
      .from('destinations')
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    console.log(`Found ${count} destinations in database`);
    if (data && data.length > 0) {
      console.log('First destination:', data[0]);
    } else {
      console.log('No destinations found in database!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testDestinations();