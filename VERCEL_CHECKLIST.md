# Deploy GastroGuard AI to Vercel

Vercel is required for the AI scan and chatbot because it hosts both the static frontend and the serverless functions in `api/`. GitHub Pages cannot run those API routes.

## 1. Import the repository

1. In Vercel, choose **Add New → Project** and import `haryyanna/gastroguardai`.
2. Keep the project root at the repository root.
3. The included `vercel.json` configures the Vite build and `dist` output. All existing `/api/...` routes are dispatched through one catch-all function in `api/[...route].js`, so the project stays under the Hobby plan's 12-function deployment limit.
4. Deploy the project. Pushing to `main` will trigger future deployments.

## 2. Add server environment variables

In **Project Settings → Environment Variables**, add these names and their real provider values. Add them to **Production** and **Preview** (and Development if needed):

```text
GEMINI_API_KEY=
CEREBRAS_API_KEY=
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
```

- Gemini powers server-side image identification and is the primary GastroBot provider.
- Cerebras is GastroBot's fallback provider and can improve FatSecret food-search terms.
- FatSecret credentials enable external nutrition search and image recognition.
- Add only services you have configured. For GastroBot, at least one of `GEMINI_API_KEY` or `CEREBRAS_API_KEY` is required. For full server-side photo identification and nutrition lookup, configure Gemini and both FatSecret values.
- Do not add these keys as `VITE_*` variables. Never put provider keys in frontend code or a committed `.env` file.
- The values previously entered in GitHub Actions Secrets do **not** transfer to Vercel. Enter them separately in Vercel without sharing them in chat.

For the listed AI scan and chatbot features, these are not required:

```text
VITE_API_BASE_URL=
NEON_DATABASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The frontend calls `/api/...` on the same Vercel domain, so leave `VITE_API_BASE_URL` unset. `NEON_DATABASE_URL` is only for unrelated Neon-backed community/admin routes. Supabase is not used by these two features.

## 3. Build settings

The repository configures:

- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## 4. Verify the AI features

After deploying, open the Vercel URL:

1. In **GastroBot**, send a question and confirm a provider response appears (not the local fallback notice).
2. In **Scan Makanan & Minuman**, capture/upload a photo and confirm the server identifies it and returns a catalog/nutrition result.
3. Search or manually select a catalog drink, then analyze to verify the drink nutrition display.
4. If provider variables were added after the first deployment, redeploy the Production deployment.

Set provider-side quotas/usage alerts. These public API routes call paid/limited AI services; never expose their server keys to the browser.

## 5. Repository deployment

The GitHub Pages workflow has been removed because it cannot run the AI API routes. Use the Vercel deployment URL as the live application URL. The old GitHub Pages site may remain visible until Pages is disabled in the repository settings.
