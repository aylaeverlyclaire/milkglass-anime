# MILKGLASS ENTERPRISE: ZERO-COST AUTO-DEPLOY & SCALABILITY RUNBOOK

## Arsitektur Zero-Cost & Sustainable Scalability

Sistem dirancang di atas arsitektur Jamstack Edge Anycast yang memenuhi 3 kriteria utama:
1. **Zero Cost ($0.00)**: Bebas biaya selamanya memanfaatkan alokasi gratis enterprise.
2. **No Credit Card (No CC)**: Tidak memerlukan verifikasi kartu kredit sama sekali.
3. **Sustainable Scalability**: Kapasitas transmisi edge tanpa batas (*unlimited bandwidth* pada Cloudflare Pages / 100GB pada GitHub Pages) dengan 300+ Point of Presence (PoP) di seluruh dunia.
4. **Auto-Deploy on Every Change**: Setiap perubahan yang dikonfirmasi langsung terkompilasi, teruji secara otomatis, dan terdeploy ke seluruh dunia dalam < 30 detik.

---

## 1. Akses Langsung Seluruh Perangkat Saat Ini (Wi-Fi / LAN)

Server lokal gateway saat ini aktif berjalan pada `0.0.0.0:8000`:
- **Desktop/Laptop Lokal**: `http://localhost:8000`
- **Ponsel (Android/iPhone), Tablet, & Smart TV**: 
  Pastikan perangkat terhubung ke Wi-Fi yang sama, buka peramban dan akses:
  ```text
  http://192.168.101.70:8000
  ```

---

## 2. Setup Auto-Deploy Global (GitHub Pages & Cloudflare Pages)

### Langkah Satu Kali (Hanya 1 Menit)
1. Buka [GitHub](https://github.com) -> Klik **New Repository** (bebas biaya, tanpa kartu kredit).
2. Beri nama repositori, misal: `milkglass-anime` (atur ke *Public*).
3. Jalankan perintah berikut di terminal:
   ```powershell
   git remote add origin https://github.com/<username-anda>/milkglass-anime.git
   git push -u origin main
   ```
4. Di halaman repositori GitHub:
   - Masuk ke **Settings** -> **Pages**.
   - Pada bagian **Build and deployment** -> **Source**, pilih **GitHub Actions**.

### Otomasi Deploy Selanjutnya
Setiap kali ada perubahan baru yang dikonfirmasi, Anda atau sistem cukup menjalankan:
```cmd
deploy.bat
```
Atau di PowerShell:
```powershell
.\deploy.ps1
```
Skrip ini akan secara otomatis:
1. Menjalankan *pre-flight regression check* (memastikan 0 ID rusak dan 0 emoji).
2. Mengompilasi *standalone preview artifact*.
3. Melakukan *commit* Git dengan format korporat.
4. Mendorong ke `main`, yang langsung memicu GitHub Actions / Cloudflare Pages untuk merilis situs secara global ke:
   ```text
   https://<username-anda>.github.io/milkglass-anime/
   ```
   Atau pada Cloudflare Pages:
   ```text
   https://milkglass-anime.pages.dev
   ```

---

## 3. Menghubungkan Domain Kustom Gratis (`milkglass.my.id`)

1. Pada Cloudflare Dashboard -> **Workers & Pages** -> Pilih `milkglass-anime`.
2. Klik **Custom domains** -> **Set up a custom domain**.
3. Masukkan: `milkglass.my.id` (atau subdomain `anime.milkglass.my.id`).
4. Sertifikat SSL/TLS HTTPS otomatis terbit dan aktif secara global tanpa biaya.
