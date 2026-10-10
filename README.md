# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Supabase Sync

Untuk sinkron data lintas device (bukan localStorage per browser), lihat panduan di `SUPABASE_SETUP.md`.

## Deploy Vercel

Untuk checklist deploy lengkap (env + verifikasi), lihat `VERCEL_CHECKLIST.md`.

## Deploy GitHub Pages tanpa backend

Scan tetap berjalan tanpa Vercel melalui pengenalan bertahap di browser. Model cepat (sekitar 21,5 MB) mulai disiapkan saat halaman scan dibuka dan mengenali kelas umum termasuk beberapa buah, makanan, serta air kemasan. Jika tidak menemukan kecocokan, model Food-101 (unduhan tambahan sekitar 60 MB pada pemakaian pertama) mencoba mengenali hidangan yang lebih beragam. Koneksi internet diperlukan untuk mengunduh model; setelah tersimpan, foto diproses di perangkat. Hasil merupakan prediksi visual dan perlu dicocokkan dengan nama makanan pada katalog nutrisi Ranstal. Hidangan atau minuman yang belum ada padanan terverifikasinya tetap perlu dipilih manual.

Untuk menerbitkan ke URL GitHub Pages yang sama, buka `Settings -> Pages`, pilih `GitHub Actions` sebagai sumber deploy, lalu push ke branch `main`. Workflow `.github/workflows/pages.yml` akan build dan menerbitkan situs.
