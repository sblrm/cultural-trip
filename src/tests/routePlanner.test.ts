/**
 * Test untuk membandingkan A* Algorithm vs Greedy Algorithm
 * 
 * Scenario Test:
 * - User di Jakarta (-6.2088, 106.8456)
 * - 5 Destinasi di Jawa Tengah & DIY
 * - Compare: Fastest, Cheapest, Balanced mode
 */

import { findOptimalRoute, OptimizationMode } from '@/services/routePlanner';
import { Destination } from '@/contexts/DestinationsContext';

// Mock destinations di Jawa Tengah & DIY
const mockDestinations: Destination[] = [
  {
    id: 1,
    name: "Candi Borobudur",
    coordinates: { latitude: -7.6079, longitude: 110.2038 },
    location: { city: "Magelang", province: "Jawa Tengah" },
    type: "Candi",
    rating: 4.8,
    price: 50000,
    duration: 120,
    hours: { open: "06:00", close: "17:00" },
    description: "Candi Buddha terbesar di dunia",
    image: "/culture-uploads/Candi Borobudur.png",
    transportation: []
  },
  {
    id: 2,
    name: "Candi Prambanan",
    coordinates: { latitude: -7.7520, longitude: 110.4915 },
    location: { city: "Sleman", province: "DIY" },
    type: "Candi",
    rating: 4.7,
    price: 50000,
    duration: 90,
    hours: { open: "06:00", close: "18:00" },
    description: "Candi Hindu terbesar di Indonesia",
    image: "/culture-uploads/Candi Prambanan.jpg",
    transportation: []
  },
  {
    id: 3,
    name: "Keraton Yogyakarta",
    coordinates: { latitude: -7.8053, longitude: 110.3644 },
    location: { city: "Yogyakarta", province: "DIY" },
    type: "Keraton",
    rating: 4.6,
    price: 15000,
    duration: 60,
    hours: { open: "08:00", close: "14:00" },
    description: "Istana Sultan Yogyakarta",
    image: "/culture-uploads/Keraton Yogyakarta.jpg",
    transportation: []
  },
  {
    id: 4,
    name: "Taman Sari",
    coordinates: { latitude: -7.8099, longitude: 110.3594 },
    location: { city: "Yogyakarta", province: "DIY" },
    type: "Taman",
    rating: 4.4,
    price: 5000,
    duration: 45,
    hours: { open: "09:00", close: "15:00" },
    description: "Taman istana air Sultan",
    image: "/culture-uploads/Taman Sari.jpg",
    transportation: []
  },
  {
    id: 5,
    name: "Malioboro",
    coordinates: { latitude: -7.7926, longitude: 110.3656 },
    location: { city: "Yogyakarta", province: "DIY" },
    type: "Jalan",
    rating: 4.5,
    price: 0,
    duration: 120,
    hours: { open: "00:00", close: "23:59" },
    description: "Pusat belanja dan wisata Yogyakarta",
    image: "/culture-uploads/Malioboro.jpg",
    transportation: []
  }
];

// User location: Jakarta
const jakartaLat = -6.2088;
const jakartaLng = 106.8456;

console.log("========================================");
console.log("🧪 A* ALGORITHM TEST - ROUTE OPTIMIZATION");
console.log("========================================\n");

console.log("📍 Starting Point: Jakarta (-6.2088, 106.8456)");
console.log("🎯 Target: Visit 3 destinations in Jawa Tengah & DIY\n");

// Async test runner
(async () => {
  try {
    // Test 1: FASTEST Mode
    console.log("⚡ TEST 1: FASTEST MODE (Prioritize Time)");
    console.log("-".repeat(50));
    const fastestRoute = await findOptimalRoute(jakartaLat, jakartaLng, mockDestinations, 3, 'fastest');
    console.log("Route Order:");
    fastestRoute.nodes.forEach((node, idx) => {
      console.log(`  ${idx + 1}. ${node.destination.name}`);
      console.log(`     - Distance: ${node.distance.toFixed(2)} km`);
      console.log(`     - Duration: ${node.duration} minutes`);
      console.log(`     - Cost: Rp ${node.cost.toLocaleString('id-ID')}`);
    });
    console.log(`\n📊 Total Stats (Fastest):`);
    console.log(`   Data Source: ${fastestRoute.dataSource === 'ors' ? '🌐 Real-time (OpenRouteService)' : '📏 Haversine Estimate'}`);
    console.log(`   Total Distance: ${fastestRoute.totalDistance.toFixed(2)} km`);
    console.log(`   Total Duration: ${fastestRoute.totalDuration} minutes (${(fastestRoute.totalDuration/60).toFixed(1)} hours)`);
    console.log(`   Total Cost: Rp ${fastestRoute.totalCost.toLocaleString('id-ID')}`);
    console.log();

    // Test 2: CHEAPEST Mode
    console.log("💰 TEST 2: CHEAPEST MODE (Prioritize Cost)");
    console.log("-".repeat(50));
    const cheapestRoute = await findOptimalRoute(jakartaLat, jakartaLng, mockDestinations, 3, 'cheapest');
    console.log("Route Order:");
    cheapestRoute.nodes.forEach((node, idx) => {
      console.log(`  ${idx + 1}. ${node.destination.name}`);
      console.log(`     - Distance: ${node.distance.toFixed(2)} km`);
      console.log(`     - Duration: ${node.duration} minutes`);
      console.log(`     - Cost: Rp ${node.cost.toLocaleString('id-ID')}`);
    });
    console.log(`\n📊 Total Stats (Cheapest):`);
    console.log(`   Data Source: ${cheapestRoute.dataSource === 'ors' ? '🌐 Real-time (OpenRouteService)' : '📏 Haversine Estimate'}`);
    console.log(`   Total Distance: ${cheapestRoute.totalDistance.toFixed(2)} km`);
    console.log(`   Total Duration: ${cheapestRoute.totalDuration} minutes (${(cheapestRoute.totalDuration/60).toFixed(1)} hours)`);
    console.log(`   Total Cost: Rp ${cheapestRoute.totalCost.toLocaleString('id-ID')}`);
    console.log();

    // Test 3: BALANCED Mode
    console.log("⚖️  TEST 3: BALANCED MODE (Best of Both)");
    console.log("-".repeat(50));
    const balancedRoute = await findOptimalRoute(jakartaLat, jakartaLng, mockDestinations, 3, 'balanced');
    console.log("Route Order:");
    balancedRoute.nodes.forEach((node, idx) => {
      console.log(`  ${idx + 1}. ${node.destination.name}`);
      console.log(`     - Distance: ${node.distance.toFixed(2)} km`);
      console.log(`     - Duration: ${node.duration} minutes`);
      console.log(`     - Cost: Rp ${node.cost.toLocaleString('id-ID')}`);
    });
    console.log(`\n📊 Total Stats (Balanced):`);
    console.log(`   Data Source: ${balancedRoute.dataSource === 'ors' ? '🌐 Real-time (OpenRouteService)' : '📏 Haversine Estimate'}`);
    console.log(`   Total Distance: ${balancedRoute.totalDistance.toFixed(2)} km`);
    console.log(`   Total Duration: ${balancedRoute.totalDuration} minutes (${(balancedRoute.totalDuration/60).toFixed(1)} hours)`);
    console.log(`   Total Cost: Rp ${balancedRoute.totalCost.toLocaleString('id-ID')}`);
    console.log();

    // Comparison
    console.log("📈 COMPARISON SUMMARY");
    console.log("=".repeat(70));
    console.log("Mode        | Duration (hours) | Cost (IDR)      | Distance (km)");
    console.log("-".repeat(70));
    console.log(`Fastest     | ${(fastestRoute.totalDuration/60).toFixed(1).padEnd(16)} | Rp ${fastestRoute.totalCost.toLocaleString('id-ID').padEnd(13)} | ${fastestRoute.totalDistance.toFixed(2)}`);
    console.log(`Cheapest    | ${(cheapestRoute.totalDuration/60).toFixed(1).padEnd(16)} | Rp ${cheapestRoute.totalCost.toLocaleString('id-ID').padEnd(13)} | ${cheapestRoute.totalDistance.toFixed(2)}`);
    console.log(`Balanced    | ${(balancedRoute.totalDuration/60).toFixed(1).padEnd(16)} | Rp ${balancedRoute.totalCost.toLocaleString('id-ID').padEnd(13)} | ${balancedRoute.totalDistance.toFixed(2)}`);
    console.log("=".repeat(70));

    // Analysis
    console.log("\n🎯 ANALYSIS:");
    console.log("-".repeat(50));

    const timeSaved = cheapestRoute.totalDuration - fastestRoute.totalDuration;
    const costSaved = fastestRoute.totalCost - cheapestRoute.totalCost;

    console.log(`✅ Fastest mode saves ${Math.abs(timeSaved)} minutes (${(Math.abs(timeSaved)/60).toFixed(1)} hours)`);
    console.log(`✅ Cheapest mode saves Rp ${Math.abs(costSaved).toLocaleString('id-ID')}`);
    console.log(`✅ Balanced mode provides optimal trade-off`);

    console.log("\n💡 RECOMMENDATIONS:");
    if (timeSaved > 120) {
      console.log("   → Use 'Fastest' for day trips (saves 2+ hours)");
    }
    if (costSaved > 200000) {
      console.log("   → Use 'Cheapest' for budget travelers (saves Rp 200k+)");
    }
    console.log("   → Use 'Balanced' for most travelers (best value)\n");

    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
})();
