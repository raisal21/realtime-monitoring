# Smoke Test

Beberapa bugs yang saya lihat

1.  [[image-1]] zustand-store buffer tidak cukup banyak untuk viewport atau logtrack mode depth dan time saat live di zoom to 1h itu trace tidak meregang sehingga terlihat atas dan-bawah
2.  [[image-1]] data flat setelah beberapa saat jadi terlihat tidak realistis, hanya seperti garis turun ke bawah.
    padahal data dalam range yang beragam kok, saya tidak tau apakah karena ini dirata ratakan harusnya tidak dirata
    ratakan karena engineer butuh tau data sebenarnya secara realtime
3.  [[image-1]] trace pairing match with depth but inmatch or non match trace pairing with time (according to time tooltip at log track random time not match with time ruler) termasuk flow ruler juga tidak match dengan time
4.  [[image-2]] zoom to ga bekerja ketika dalam mode depth, tapi bekerja dalam mode time walaupun masih aneh
5.  [[image-3]] zoom to pada mode time itu tidak memanjang jadi ticknya menyempit kebawah sepertinya standard dari 7d
    zoom to juga diberlakukan untuk 6h, 12h, 24h. sedangkan zoom to 3d itu bekerja dengan bagus tidak ada sisa atas dan bawah
6.  zoom to mode time pada 7d itu menyisakan bagian atas
7.  well profile track slider sepertinya tidak bisa memanggil /api/tiles sehingga ga bisa ditarik handle untuk rezise nya sama
    sekali, time ruler dan depth ruler slider itu bekerja dengan baik
8.
