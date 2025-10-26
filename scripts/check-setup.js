// Simple setup checker for npm users
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Checking CulturalTrip Setup...\n');

let hasErrors = false;

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
    console.log('❌ File .env.local tidak ditemukan!');
    console.log('📝 Membuat dari template...\n');
    
    const examplePath = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
        console.log('✅ File .env.local berhasil dibuat');
        console.log('⚠️  PENTING: Edit .env.local dan isi dengan credentials Supabase Anda!\n');
        console.log('Buka Supabase Dashboard → Settings → API untuk mendapatkan:');
        console.log('  - VITE_SUPABASE_URL');
        console.log('  - VITE_SUPABASE_ANON_KEY\n');
        hasErrors = true;
    } else {
        console.log('❌ .env.example juga tidak ditemukan!\n');
        hasErrors = true;
    }
} else {
    console.log('✅ File .env.local ditemukan');
    
    // Read and check env vars
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('VITE_SUPABASE_URL=your_');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.includes('VITE_SUPABASE_ANON_KEY=your_');
    
    if (!hasUrl) {
        console.log('❌ VITE_SUPABASE_URL belum diset di .env.local');
        hasErrors = true;
    } else {
        console.log('✅ VITE_SUPABASE_URL configured');
    }
    
    if (!hasKey) {
        console.log('❌ VITE_SUPABASE_ANON_KEY belum diset di .env.local');
        hasErrors = true;
    } else {
        console.log('✅ VITE_SUPABASE_ANON_KEY configured');
    }
}

console.log('\n📋 Next Steps:\n');

if (hasErrors) {
    console.log('1. Edit .env.local dengan credentials Supabase Anda');
    console.log('2. Jalankan: npm run test:connection');
    console.log('3. Buka docs/QUICK_START.md untuk panduan setup\n');
} else {
    console.log('Setup terlihat OK! Coba test koneksi:');
    console.log('  npm run test:connection\n');
}
