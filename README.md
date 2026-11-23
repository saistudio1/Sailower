# Lower Third Studio

Studio desain grafis lower third profesional berbasis browser dengan ekspor PNG transparan (RGBA / Alpha Channel) untuk CapCut, VN, Premiere Pro, DaVinci Resolve, OBS, dan kebutuhan UKIN PPG.

## Cara Deploy ke Netlify (Pilih Salah Satu)

### Opsi 1: Langsung Drag & Drop Tanpa Build (`netlify-drop/`)
Folder **`netlify-drop/`** sudah berisi `index.html` (versi tunggal siap pakai) dan `_redirects`:
1. Unduh / ekstrak project ini.
2. Buka **[app.netlify.com/drop](https://app.netlify.com/drop)**.
3. Seret folder **`netlify-drop`** (bukan folder root project!) ke halaman Netlify Drop.
4. Selesai — situs langsung aktif.

> **Catatan Penting**: Jangan menyeret folder root project ke Netlify Drop karena `index.html` di root adalah file entry development Vite (`/src/main.tsx`). Selalu seret folder `netlify-drop/` atau `dist/`.

### Opsi 2: Deploy Otomatis via Git (GitHub / GitLab / Bitbucket)
1. Push repository ini ke GitHub/GitLab/Bitbucket.
2. Di dashboard **Netlify** → **Add new site** → **Import an existing project**.
3. Netlify akan otomatis menggunakan `netlify.toml` dan `.npmrc` (`NPM_FLAGS=--legacy-peer-deps`, `NODE_VERSION=22`, build `npm run build`, publish `dist`).
4. Klik **Deploy site**.

### Opsi 3: Via Netlify CLI
```bash
npm install
npm run build
npx netlify-cli deploy --prod --dir=dist
```

## File HTML Tunggal (Offline / Lokal)
File **`lower-third-studio.html`** di root project berisi seluruh aplikasi dalam 1 file HTML mandiri.
