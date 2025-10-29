/**
 * Script untuk import destinasi dari JSON atau CSV
 * Usage: node scripts/import-destinations.js <file.json|file.csv>
 * 
 * Format JSON:
 * [
 *   {
 *     "name": "Nama Destinasi",
 *     "city": "Kota",
 *     "province": "Provinsi",
 *     "type": "Kategori",
 *     "latitude": -6.1751,
 *     "longitude": 106.8650,
 *     "hours": { "open": "08:00", "close": "17:00" },
 *     "duration": 120,
 *     "description": "Deskripsi...",
 *     "image": "/culture-uploads/image.jpg",
 *     "price": 50000,
 *     "transportation": ["Bus", "Kereta"]
 *   }
 * ]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Gunakan service role key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse CSV file to array of destinations
 */
function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map(record => ({
    name: record.name,
    city: record.city,
    province: record.province,
    type: record.type,
    latitude: parseFloat(record.latitude),
    longitude: parseFloat(record.longitude),
    hours: {
      open: record.hours_open || record.open,
      close: record.hours_close || record.close
    },
    duration: parseInt(record.duration),
    description: record.description,
    image: record.image,
    price: parseFloat(record.price),
    rating: 0, // Rating awal 0, akan dihitung dari reviews
    transportation: record.transportation.split('|') // Format: "Bus|Kereta|Motor"
  }));
}

/**
 * Parse JSON file to array of destinations
 */
function parseJSON(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  // Ensure rating is 0 if not provided
  return data.map(dest => ({
    ...dest,
    rating: 0 // Force rating to 0 for new destinations
  }));
}

/**
 * Insert destinations to Supabase
 */
async function insertDestinations(destinations) {
  console.log(`📥 Importing ${destinations.length} destinations...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const destination of destinations) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .insert([destination])
        .select();

      if (error) throw error;

      console.log(`✅ Imported: ${destination.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to import ${destination.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📦 Total: ${destinations.length}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: node scripts/import-destinations.js <file.json|file.csv>');
    process.exit(1);
  }

  const filePath = args[0];
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let destinations;

  try {
    if (ext === '.json') {
      console.log('📄 Parsing JSON file...');
      destinations = parseJSON(filePath);
    } else if (ext === '.csv') {
      console.log('📄 Parsing CSV file...');
      destinations = parseCSV(filePath);
    } else {
      console.error('❌ Unsupported file format. Use .json or .csv');
      process.exit(1);
    }

    await insertDestinations(destinations);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
