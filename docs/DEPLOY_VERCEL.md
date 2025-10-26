# 🚀 Deploying CulturalTrip to Vercel

This guide shows how to deploy the CulturalTrip (Vite + React) site to Vercel.

## Summary (what we'll do)
- Create a Vercel project linked to this Git repo
- Set required Environment Variables
- Configure build command and output directory
- Deploy and verify the site

## 1) Create project on Vercel
1. Go to https://vercel.com and sign in.
2. Click "New Project" → "Import Git Repository" and select your `cultural-trip` repo.
3. When Vercel detects the project it may auto-populate settings. Use the settings below if not auto-detected.

## 2) Environment Variables (must set)
In your Vercel project settings → Environment Variables add the following keys (for each environment: Production, Preview, Development as needed):

- `VITE_SUPABASE_URL` = https://<your-project-id>.supabase.co
- `VITE_SUPABASE_ANON_KEY` = <your-supabase-anon-key>
- `GEMINI_API_KEY` = <your-google-ai-key>  # NOTE: server-side secret, do NOT prefix with VITE_

Notes:
- Keys prefixed with `VITE_` are embedded into the client bundle by Vite. **Do not** store sensitive keys (like Google API keys) with a `VITE_` prefix.
- Use `GEMINI_API_KEY` as a server-side secret in Vercel (Project Settings → Environment Variables). The app includes a serverless proxy at `/api/gemini` which reads `process.env.GEMINI_API_KEY`.
- For production, use values from Supabase Dashboard → Settings → API.

Important: Do NOT commit environment files (`.env`, `.env.local`) to Git. This repo includes a `.gitignore` that ignores `.env*`. If you previously committed `.env` with secrets, run the helper script to untrack them:

PowerShell (Windows):
```powershell
.
\scripts\remove-sensitive.ps1
```

Bash (macOS/Linux):
```bash
sh scripts/remove-sensitive.sh
```

If secrets were already pushed to GitHub, consider purging them from history with the BFG Repo-Cleaner or `git filter-repo` (follow their docs carefully). After removing secrets, rotate the exposed keys in the provider (Supabase / Google).

## 3) Build & Output settings
Vercel should detect this is a static Vite app. If it doesn't, set:
- Framework Preset: `Other` or `Vite` (either works)
- Build command: `npm run build`
- Output directory: `dist`
- Install Command: `npm install`

We also included a `vercel.json` at the repo root which sets the builder to `@vercel/static-build` and `dist` as the output directory.

## 4) Custom Domain (optional)
- Add your custom domain in Vercel project → Domains. Follow DNS verification steps.

## 5) Automatic deploys
- Enable automatic deploys on pushes to `main` (or your chosen branch). Vercel will build and deploy every push.

## 6) Local verification (before deploy)
Run these locally to confirm the build and preview step works:

```bash
# Install deps
npm install

# Build
npm run build

# Preview (serves the built site locally)
npm run preview
```

Open http://localhost:5173 (or the port shown) to verify.

## 7) Troubleshooting
- Build fails with missing env: Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel UI.
- 404s for client-side routes: `vercel.json` contains a fallback route to `index.html`.
- Gemini AI errors: verify `VITE_GEMINI_API_KEY` and that the model is allowed for your key.

## 8) Post-deploy checks
- Visit the Production URL shown by Vercel after deployment.
- Test features that hit Supabase (Destinations page, Planner, Login). If login fails, check Supabase RLS and CORS.

---

If you want, I can:
- Run a local build now and report any build errors
- Prepare a GitHub Action (optional) for extra checks before deploy
