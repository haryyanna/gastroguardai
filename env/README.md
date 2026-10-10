# Environment variables

This folder contains setup guidance only. Do not put real API keys or passwords in this folder or commit them to GitHub.

## Local development

1. Copy the root `.env.example` file to `.env` in the project root.
2. Add your real values to `.env`.
3. Restart the Vite development server after changing environment values.

The root `.env` is ignored by Git. Commit `.env.example` only; it contains variable names and blank placeholders.

## Vercel deployment

- For the AI scan and chatbot, add these server values in **Vercel → Project Settings → Environment Variables**:

  ```text
  GEMINI_API_KEY
  CEREBRAS_API_KEY
  FATSECRET_CLIENT_ID
  FATSECRET_CLIENT_SECRET
  ```

- Add only keys for providers you use. The values entered as GitHub Actions Secrets do not automatically transfer to Vercel.
- The frontend calls API routes on the same Vercel domain. Leave `VITE_API_BASE_URL` unset.
- `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, and `FATSECRET_CLIENT_SECRET` must remain server-side; never rename them to `VITE_*`.

GitHub Pages publishes static files only and cannot run the functions in `api/`. The Vercel deployment is the live version for AI scanning and chat.

Firebase web configuration and the Supabase anon key are client-side values, not server secrets. Protect their use with Firebase/Supabase security rules and provider-side restrictions. Never put a Supabase `service_role` key in a `VITE_*` variable.

## API key handling

AyuScan and GastroBot send requests to the server-side API. They do not ask visitors to enter a provider API key; keep all provider credentials in Vercel environment variables.
