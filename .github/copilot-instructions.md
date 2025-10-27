# TravoMate AI Coding Agent Instructions

## Project Context
TravoMate is a React+TypeScript Indonesian cultural heritage trip planner with real-time route optimization, AI-powered recommendations, and integrated payments. Key stacks: Vite, Supabase (PostgreSQL+PostGIS), Gemini AI, Midtrans payments, OpenRouteService.

## Architecture Overview

### Core Service Pattern
The app follows a **Context + Services** architecture:
- **Contexts** (`src/contexts/`): AuthContext, DestinationsContext, MapContext manage global state
- **Services** (`src/services/`): Business logic layers - `routePlanner.ts` (A* algorithm), `dynamicPricing.ts`, `paymentService.ts`
- **API Proxies** (`api/`): Server-side functions for Gemini AI and Midtrans to keep API keys secure

### Database Layer
- **Supabase client**: `src/lib/supabase.ts` exports typed functions (`getDestinations`, `createTicket`, etc.)
- **Generated types**: `src/lib/database.types.ts` and `src/types/supabase.ts` 
- **Geography**: PostGIS extension for spatial queries on `destinations.location`

### Key Integration Points
- **OpenRouteService**: Real-time routing with fallback to Haversine formula in `routePlanner.ts`
- **Gemini AI**: Proxied through `/api/gemini.ts` for trip planning assistance
- **Midtrans**: Complete payment flow via `/api/midtrans.ts` with webhook handling

## Development Patterns

### Service Architecture
```typescript
// Services return structured data with error handling
export const findOptimalRoute = async (...) => {
  // A* algorithm with real-time API integration
  // Returns: Route with dataSource: 'ors' | 'fallback'
}
```

### Context Usage
```typescript
// Always destructure from custom hooks
const { destinations, loading } = useDestinations();
const { user, isAuthenticated } = useAuth();
const { userLocation, locateUser } = useMap();
```

### Error Patterns
- **Supabase errors**: Handled in service layer, show user-friendly `toast.error()`
- **API fallbacks**: OpenRouteService → Haversine formula, preserve user experience
- **Payment flow**: Complete error states for pending/failed/success

## Critical Workflows

### Development Commands
```bash
# Use Bun for faster installs (npm also supported)
bun install
bun run dev

# Test connections before coding
bun run test:connection
bun run test:destinations

# Setup verification
bun run setup:check
```

### Database Workflow
1. **Schema**: `supabase/schema.sql` defines PostGIS-enabled tables
2. **Migrations**: `supabase/migrations/` for incremental changes  
3. **Seed data**: `supabase/seed-data.sql` populates cultural sites
4. **Setup script**: `supabase/complete-setup.sql` runs everything

### Payment Integration
- **Client flow**: `CheckoutPage.tsx` → `createTransaction()` → saves to DB → Midtrans Snap popup
- **Server webhook**: `/api/midtrans?action=notification` handles payment completion
- **Auto-booking**: Database trigger `create_booking_after_payment` automatically creates `bookings` and `purchases` when transaction status = 'settlement' or 'capture'
- **Key metadata**: `trip_data_id` stores destination ID for auto-booking creation
- **Status flow**: pending → settlement/capture → trigger fires → booking created
- **Phone selection**: Checkout auto-loads up to 3 saved phone numbers from profile for easy selection

## ML Pipeline Integration

### Training Flow
```bash
cd ml_pipeline
python train_model.py --min-samples 100 --output-dir ../public/models
```
- **Data source**: `ml_training_data` view in Supabase
- **Export**: TensorFlow.js compatible neural network
- **Metadata**: `public/models/metadata.json` for browser consumption

### Prediction Services
- **Hybrid model**: `src/services/hybridPrediction.ts` combines ML + rule-based
- **Data collection**: `src/services/mlDataCollection.ts` logs trip data for retraining

## Project-Specific Conventions

### File Naming
- **Pages**: `PascalCase.tsx` (HomePage, CheckoutPage)
- **Components**: `PascalCase.tsx` organized by feature in subdirs
- **Services**: `camelCase.ts` (routePlanner, dynamicPricing)  
- **Types**: Match Supabase generated types, extend as needed

### API Design
- **Serverless functions**: In `api/` directory, use Vercel's VercelRequest/VercelResponse
- **Rate limiting**: Implemented in-memory per serverless function
- **Security**: Server keys in environment variables, never VITE_ prefixed

### State Management
- **Global state**: React Context for auth, destinations, map location
- **Local state**: useState for component-specific data
- **Server state**: TanStack Query for caching API responses
- **Forms**: react-hook-form with Zod validation

## Debugging Patterns

### Database Connection Issues
```bash
# Verify Supabase setup
bun run setup:verify
# Check if PostGIS enabled
# Run: SELECT * FROM pg_extension WHERE extname = 'postgis';
```

### API Integration Debugging
- **ORS API**: Check rate limits (2000/day), verify coordinates format
- **Gemini**: Proxy errors logged server-side, check Vercel function logs
- **Midtrans**: Use sandbox environment, test with provided card numbers

### Route Planning Issues
- **No results**: Check if user location permission granted
- **Poor performance**: Enable caching in `openRouteService.ts`, verify A* heuristic
- **Cost accuracy**: Validate `dynamicPricing.ts` multipliers for Indonesian traffic patterns

## Key Dependencies to Understand

### UI Framework
- **shadcn/ui**: Pre-built Radix components in `src/components/ui/`
- **Lucide React**: Icon system, import specific icons
- **Tailwind CSS**: Utility-first styling, configured in `tailwind.config.ts`

### Maps & Geography  
- **Leaflet**: Interactive maps in `src/components/map/`
- **PostGIS**: Spatial queries, geography data type for coordinates
- **OpenRouteService**: Matrix API for real-time routing

### Infrastructure
- **Vercel**: Deployment platform, serverless functions in `api/`
- **Supabase**: Backend-as-a-service, auth + database + real-time
- **Bun**: Fast package manager and runtime, preferred over npm

When working on this codebase, prioritize user experience with real-time data, maintain the service abstraction layers, and ensure secure API key handling in serverless functions.