# Lower Third Studio

Studio desain grafis lower third profesional berbasis browser dengan ekspor PNG transparan (RGBA / Alpha Channel) untuk CapCut, VN, Premiere Pro, DaVinci Resolve, OBS, dan kebutuhan UKIN PPG.

Aplikasi berjalan 100% di sisi klien tanpa membutuhkan backend, login, ataupun database eksternal.

## File HTML Tunggal (Standalone)

Saat build dijalankan (`npm run build`), seluruh aplikasi (HTML, CSS, JavaScript, 26 template, editor grafis, dan mesin ekspor PNG transparan) digabung menjadi **satu file HTML mandiri**:
- `lower-third-studio.html` (tersedia langsung di root project—dapat langsung dibuka di browser)
- `dist/index.html` (versi tunggal siap deploy untuk Netlify)

## Cara Deploy ke Netlify

### Opsi 1: Deploy Otomatis via Git (GitHub / GitLab / Bitbucket)
1. Push repository ini ke GitHub, GitLab, atau Bitbucket.
2. Masuk ke dashboard **Netlify** → **Add new site** → **Import an existing project**.
3. Pilih repository Anda. Netlify akan otomatis membaca `netlify.toml` (`npm run build`, publish `dist`).
4. Klik **Deploy site**.

### Opsi 2: Manual Drag & Drop (Netlify Drop)
1. Jalankan `npm install && npm run build`.
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop) dan seret folder **`dist/`** (atau file tunggal `dist/index.html` di dalamnya).

### Opsi 3: Via Netlify CLI
```bash
npm install
npm run build
npx netlify-cli deploy --prod --dir=dist
```
