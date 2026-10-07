# Genel Sistem ve Altyapı Mimarisi

- **Proje Amacı:** Gazete ve basılı yayın kupürlerini kamera/galeriden alıp cihaz üzerinde yerel OCR ile metne dönüştüren, arşivleyen ve görüntüleyen bağımsız mobil uygulama.
- **Platformlar:** Mobil (iOS & Android)
- **Backend / API:** Sunucusuz / Bağımsız (Cihaz içi Google ML Kit OCR)
- **Veritabanı:** Cihaz İçi Yerel Depolama (SQLite / AsyncStorage)
- **Sunucu & Dağıtım:** Sunucu dağıtımı (deploy) adımları yoktur; cihaz üzerinde doğrudan çalışır.
- **CI/CD & Paketleme:** Yerel mobil derleme ve test ortamı

## Katmanlar
- [[architecture/mobile|Mobil Mimarisi]]
- [[contracts/api-endpoints|Veri Sözleşmeleri ve Modeller]]

## İlgili Protokoller
- [[_rules/deployment-cicd|Mobil Paketleme ve Test Kuralları]]
- [[_rules/git-workflow|Git Protokolleri]]
- [[_rules/code-quality|Kodlama Standartları]]
