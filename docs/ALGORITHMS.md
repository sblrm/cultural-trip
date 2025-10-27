# 🧮 Algoritma yang Digunakan di TravoMate

Dokumentasi teknis tentang algoritma-algoritma yang digunakan dalam aplikasi TravoMate untuk route planning dan cost estimation.

---

## 📍 1. Route Planning Algorithm

### **A\* (A-Star) Pathfinding Algorithm**

#### **Overview**
Aplikasi menggunakan **A\* Algorithm** untuk menemukan rute wisata optimal berdasarkan preferensi pengguna. A\* adalah informed search algorithm yang menggunakan heuristic function untuk efficiently explore state space.

#### **Mengapa A\*?**
- ✅ **Guaranteed Optimal**: Menemukan rute terbaik (jika heuristic admissible)
- ✅ **Efficient**: Lebih cepat dari Dijkstra dengan guided search
- ✅ **Flexible**: Support multiple optimization criteria
- ✅ **Scalable**: Handle 5-10 destinations dengan performa baik

#### **Upgrade dari Greedy Algorithm**
**Before (Greedy Nearest Neighbor):**
```typescript
// Selalu pilih destinasi terdekat yang belum dikunjungi
while (unvisited.length > 0) {
  let nearest = findNearest(current, unvisited);
  route.push(nearest);
  current = nearest;
}
```
**Problem:** Stuck di local optimum, tidak mempertimbangkan global path

**After (A\* Algorithm):**
```typescript
// Explore paths berdasarkan f(n) = g(n) + h(n)
while (!openSet.isEmpty()) {
  current = openSet.dequeueMin(); // Node with lowest f-score
  
  if (isGoal(current)) {
    return reconstructPath(current);
  }
  
  for (neighbor of getNeighbors(current)) {
    tentativeG = g[current] + cost(current, neighbor);
    if (tentativeG < g[neighbor]) {
      cameFrom[neighbor] = current;
      g[neighbor] = tentativeG;
      f[neighbor] = g[neighbor] + heuristic(neighbor);
      openSet.enqueue(neighbor, f[neighbor]);
    }
  }
}
```

#### **Implementation Details**

**1. State Representation**
```typescript
interface AStarState {
  visited: Set<number>;          // Destinasi yang sudah dikunjungi
  currentDest: Destination | null; // Lokasi saat ini
  path: RouteNode[];             // Rute yang sudah diambil
  gScore: number;                // Actual cost dari start
  fScore: number;                // gScore + heuristic
}
```

**2. Priority Queue**
```typescript
class PriorityQueue<T> {
  // Min-heap untuk efficiently get node dengan f-score terendah
  enqueue(element: T, priority: number): void
  dequeue(): T | undefined
  isEmpty(): boolean
}
```

**3. Heuristic Function (h(n))**

Admissible heuristic yang **never overestimates** cost ke goal:

```typescript
function calculateHeuristic(
  current: Destination,
  remaining: Destination[],
  mode: OptimizationMode
): number {
  // Minimum distance ke destinasi terdekat yang belum dikunjungi
  const minDistance = Math.min(
    ...remaining.map(dest => 
      calculateDistance(current, dest)
    )
  );
  
  // Convert to cost based on mode
  if (mode === 'fastest') {
    return calculateTravelDuration(minDistance, mode);
  } else if (mode === 'cheapest') {
    return calculateTravelCost(minDistance, mode);
  } else { // balanced
    // Weighted combination
    const duration = calculateTravelDuration(minDistance, mode);
    const cost = calculateTravelCost(minDistance, mode);
    return (duration * 100) + (cost / 1000);
  }
}
```

**Properties:**
- ✅ **Admissible**: h(n) ≤ actual cost (uses minimum distance)
- ✅ **Consistent**: h(n) ≤ cost(n, n') + h(n') (triangle inequality)
- ✅ **Mode-specific**: Different heuristics for different goals

**4. Cost Function (g(n))**

Actual cost dari start node ke current node:

```typescript
function calculateGScore(
  distance: number,
  mode: OptimizationMode
): number {
  if (mode === 'fastest') {
    return calculateTravelDuration(distance, mode);
  } else if (mode === 'cheapest') {
    return calculateTravelCost(distance, mode);
  } else { // balanced
    const duration = calculateTravelDuration(distance, mode);
    const cost = calculateTravelCost(distance, mode);
    return (duration * 100) + (cost / 1000); // Weighted sum
  }
}
```

---

## 💰 2. Cost Estimation Algorithm

### **Enhanced Rule-Based Calculation**

#### **Overview**
Cost estimation menggunakan **realistic multi-factor calculation** dengan parameter yang disesuaikan untuk kondisi Indonesia.

#### **Factors Considered**

**1. Base Cost Components**
```typescript
const baseCost = 50000; // Base trip cost (parkir, entrance, misc)
```

**2. Distance-Based Cost**
```typescript
const costPerKm = {
  fastest: 8000,    // Toll roads (Rp 8k/km)
  cheapest: 3000,   // Non-toll roads (Rp 3k/km)
  balanced: 5000    // Mix (Rp 5k/km)
};
```

**3. Fuel Cost (Realistic)**
```typescript
const fuelPrice = 10000;        // Rp 10,000 per liter (Pertalite)
const fuelConsumption = 12;     // 12 km per liter (average car)
const fuelCost = (distance / fuelConsumption) * fuelPrice;
```

**4. Total Cost Formula**
```typescript
totalCost = baseCost + (costPerKm[mode] * distance) + fuelCost
```

**Example Calculation:**
```
Distance: 100 km
Mode: Balanced

baseCost     = Rp 50,000
roadCost     = 100 km × Rp 5,000/km = Rp 500,000
fuelCost     = (100 km / 12 km/L) × Rp 10,000/L = Rp 83,333
────────────────────────────────────────────────
totalCost    = Rp 633,333
```

---

## ⏱️ 3. Duration Estimation Algorithm

### **Mode-Specific Speed Calculation**

#### **Speed Parameters**
```typescript
const averageSpeed = {
  fastest: 60,    // Highway/toll roads (60 km/h)
  cheapest: 35,   // City/non-toll roads (35 km/h)
  balanced: 45    // Mixed routes (45 km/h)
};
```

#### **Traffic Buffer**
```typescript
const trafficBuffer = {
  fastest: 1.15,    // +15% for minimal traffic
  cheapest: 1.30,   // +30% for heavy city traffic
  balanced: 1.20    // +20% for moderate traffic
};
```

#### **Formula**
```typescript
baseTime = (distance / averageSpeed[mode]) * 60; // Convert to minutes
actualTime = baseTime * trafficBuffer[mode];
```

**Example:**
```
Distance: 100 km
Mode: Fastest

baseTime   = (100 km / 60 km/h) × 60 min/h = 100 minutes
buffer     = 100 min × 1.15 = 115 minutes
────────────────────────────────────────────
actualTime = 115 minutes (1 hour 55 minutes)
```

---

## 🎯 4. Optimization Modes

### **Mode Comparison**

| Mode | Goal | Speed | Cost/km | Traffic | Use Case |
|------|------|-------|---------|---------|----------|
| **Fastest** ⚡ | Minimize time | 60 km/h | Rp 8,000 | +15% | Day trips, tight schedule |
| **Cheapest** 💰 | Minimize cost | 35 km/h | Rp 3,000 | +30% | Budget travelers, backpackers |
| **Balanced** ⚖️ | Optimize both | 45 km/h | Rp 5,000 | +20% | Regular tourists (recommended) |

### **Algorithm Selection Logic**

```typescript
// A* automatically chooses optimal route based on f(n)
f(n) = g(n) + h(n)

// Where:
// - g(n) = actual cost from start (time or money)
// - h(n) = estimated cost to goal (heuristic)

// Mode determines what "cost" means:
if (mode === 'fastest') {
  cost = duration (minutes)
} else if (mode === 'cheapest') {
  cost = money (Rupiah)
} else { // balanced
  cost = weighted_combination(duration, money)
}
```

---

## 📊 5. Performance Analysis

### **Test Results** (Jakarta → Yogyakarta, 3 destinations)

```
Mode        | Duration   | Cost          | Distance
────────────|──────────--|───────────────|──────────
Fastest ⚡  | 8.2 hours  | Rp 3,946,390  | 429.78 km
Cheapest 💰 | 15.9 hours | Rp 1,793,350  | 428.70 km
Balanced ⚖️ | 11.4 hours | Rp 2,650,750  | 428.70 km
```

**Key Insights:**
- ✅ Fastest saves **7.7 hours** (worth Rp 2.15M premium)
- ✅ Cheapest saves **Rp 2.15M** (worth 7.7 hours extra)
- ✅ Balanced provides **optimal trade-off** for most users

### **Algorithm Complexity**

```
Time Complexity:  O(b^d × log(b^d))
Space Complexity: O(b^d)

Where:
- b = branching factor (~5 destinations per level)
- d = depth (max destinations to visit, typically 3-5)

For typical use (3-5 destinations from pool of 10):
- Nodes explored: ~100-200
- Execution time: <100ms
- Memory usage: <1MB
```

---

## 🚀 6. Future Enhancements

### **Phase 1: External API Integration** (Planned)
```typescript
// Google Maps Distance Matrix API
const realTimeData = await getDistanceMatrix({
  origins: [currentLocation],
  destinations: [destination],
  mode: 'driving',
  trafficModel: 'best_guess'
});

// Use real traffic data instead of static buffers
const actualDuration = realTimeData.duration_in_traffic;
```

### **Phase 2: Machine Learning** (Research)
```typescript
// Random Forest for cost prediction
const features = [
  distance,
  timeOfDay,
  dayOfWeek,
  weatherCode,
  trafficLevel,
  fuelPrice
];

const predictedCost = await mlModel.predict(features);
```

**Benefits:**
- 📈 Self-improving with user feedback
- 🎯 More accurate predictions
- 🌐 Adapt to real-world conditions

---

## 📚 References

1. **A\* Algorithm**: Hart, P. E., Nilsson, N. J., & Raphael, B. (1968). "A Formal Basis for the Heuristic Determination of Minimum Cost Paths"
2. **Traveling Salesman Problem**: Held, M., & Karp, R. M. (1962). "A Dynamic Programming Approach to Sequencing Problems"
3. **Heuristic Search**: Russell, S., & Norvig, P. (2020). "Artificial Intelligence: A Modern Approach" (4th ed.)

---

## 🛠️ Implementation Files

- **Algorithm Core**: `src/services/routePlanner.ts`
- **UI Component**: `src/components/planner/PlannerSettingsCard.tsx`
- **Page Integration**: `src/pages/PlannerPage.tsx`
- **Test Suite**: `src/tests/routePlanner.test.ts`

---

**Last Updated**: October 27, 2025  
**Version**: 2.0 (A\* Algorithm Implementation)  
**Author**: TravoMate Development Team
