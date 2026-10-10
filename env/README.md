# Environment variables

This folder contains setup guidance only. Do not put real API keys or passwords in this folder or commit them to GitHub.

## Local development

1. Copy the root `.env.example` file to `.env` in the project root.
2. Add your real values to `.env`.
3. Restart the Vite development server after changing environment values.

The root `.env` is ignored by Git. Commit `.env.example` only; it contains variable names and blank placeholders.

## GitHub and deployment

GitHub does not load environment variables from a repository folder. To configure a GitHub Actions workflow, add values under:

**Repository → Settings → Secrets and variables → Actions**

- Add these names under **Secrets** when a workflow or deployment integration needs them:

  ```text
  GEMINI_API_KEY
  CEREBRAS_API_KEY
  FATSECRET_CLIENT_ID
  FATSECRET_CLIENT_SECRET
  NEON_DATABASE_URL
  ```

  Add only the names for services you use. Enter each provider's key/credential as the secret value; do not include quotes or commit the value to a file.
- Use **Variables** only for non-secret settings.
- A secret is available to a workflow only when that workflow explicitly references it. Never pass a server secret into a `VITE_*` variable: Vite embeds `VITE_*` values in public browser files.

The GitHub Pages workflow publishes a static frontend and does not deploy the functions in `api/`. It passes `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from GitHub Actions Secrets into the build. Those values are included in public browser code and are not server secrets; protect Supabase data with correct Row Level Security policies.

The API routes in `api/` need a backend host such as Vercel. GitHub Pages cannot run them, and the server secrets above are intentionally not passed into the frontend build. To enable those API-backed features, deploy the frontend and API routes to a provider that supports serverless functions and configure the private values in that provider's project settings.

Firebase web configuration and the Supabase anon key are client-side values, not server secrets. Protect their use with Firebase/Supabase security rules and provider-side restrictions. Never put a Supabase `service_role` key in a `VITE_*` variable.

## AyuScan Gemini key

AyuScan also has an optional in-app Gemini key field. That value is kept in the current browser tab's session storage and sent from the browser directly to Gemini for image analysis. For a deployed public website, prefer a server-side proxy with `GEMINI_API_KEY` configured on the API host; do not enter a personal key on a shared device.
