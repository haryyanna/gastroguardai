# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Supabase Sync

Untuk sinkron data lintas device (bukan localStorage per browser), lihat panduan di `SUPABASE_SETUP.md`.

## Deploy ke Vercel

Vercel menjalankan frontend sekaligus fungsi backend pada `api/`, sehingga scan makanan/minuman dan GastroBot dapat memakai API key yang tersimpan di server. Hubungkan repository GitHub ke Vercel, lalu ikuti `VERCEL_CHECKLIST.md` untuk pengaturan environment variables.

Jangan masukkan API key Gemini, Cerebras, atau FatSecret ke variabel `VITE_*`; variabel tersebut akan dipublikasikan ke browser.
