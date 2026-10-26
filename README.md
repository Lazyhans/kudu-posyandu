# Remix of Posyandu Digital Go

Buatkan sebuah aplikasi Mobile Web dengan prioritas tampilan yang sangat ramah pengguna smartphone (mobile-friendly) berjudul "Digitalisasi Administrasi Posyandu RW 06 Kelurahan Kudu" untuk mendigitalisasi pencatatan tumbuh kembang balita oleh kader Posyandu di lapangan. Aplikasi ini harus dibangun menggunakan stack teknologi React, Tailwind CSS, Lucide Icons, dan terintegrasi penuh dengan database relasional Supabase. Pada halaman dashboard utama, tampilkan ringkasan data yang mencakup total balita terdaftar, jumlah balita yang ditimbang bulan ini, serta grafik interaktif yang menunjukkan tren status gizi balita, lengkap dengan identitas teks bertuliskan "KKN PPM XXVIII UNIVERSITAS SEMARANG Kelurahan KUDU" dan tombol akses cepat untuk menambah data serta pencatatan bulanan. Aplikasi harus memiliki fitur Manajemen Data Balita (CRUD) berupa formulir pendaftaran balita baru yang mencakup baris input Nama Lengkap, NIK Anak, Tanggal Lahir, Jenis Kelamin, Nama Ibu/Orang Tua, dan Alamat RT lingkup RW 06, lengkap dengan halaman daftar balita yang memiliki fitur pencarian berbasis Nama atau NIK. Sediakan juga Form Pencatatan Bulanan yang dilengkapi dengan kalkulator status gizi instan secara real-time, di mana ketika kader memasukkan berat badan (kg) dan tinggi badan (cm) seorang balita, sistem langsung memunculkan indikator status gizi visual sederhana menggunakan badge warna untuk status Normal, Gizi Kurang, atau Berisiko Stunting. Terakhir, buatkan halaman riwayat rekam medis per balita dalam bentuk daftar kartu yang rapi serta tombol simulasi untuk mengekspor data bulanan tersebut ke format Excel atau CSV agar memudahkan pelaporan ke tingkat kelurahan. Pastikan desain antarmukanya bersih dan modern dengan dominasi warna ramah kesehatan seperti hijau teal atau biru medis, serta pastikan ukuran tombol dan input teks dibuat cukup besar agar nyaman ditekan oleh jari para kader langsung dari layar HP mereka.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kudu-posyandu.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/556d15a9-6976-471f-bcca-f98288350bf9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
