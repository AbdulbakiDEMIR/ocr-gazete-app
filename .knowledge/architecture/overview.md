# Genel Sistem ve Altyapı Mimarisi

- **Proje Amacı:** Kullanıcının belirlediği klasördeki gazete fotoğraflarını tarayan, kullanılan/kullanılmayan durumunu takip eden, kullanıcı tarafından belirlenen 4 köşeden kupürü kırparak cihaz içi OCR uygulayan, kullanıcı inceleme ve onayının ardından görsel dosya adına göre kataloglayan bağımsız mobil uygulama.
- **Platformlar:** Mobil (iOS & Android)
- **Backend / API:** Sunucusuz / Bağımsız (Cihaz içi Google ML Kit OCR)
- **Veritabanı:** Cihaz İçi Yerel Depolama (SQLite / AsyncStorage)
- **Sunucu & Dağıtım:** Sunucu dağıtımı (deploy) adımları yoktur; cihaz üzerinde doğrudan çalışır.
- **CI/CD & Paketleme:** Yerel mobil derleme ve test ortamı

## Katmanlar & Akış
- [[architecture/mobile|Mobil Mimarisi]]
- [[contracts/api-endpoints|Veri Sözleşmeleri ve Modeller]]

## İlgili Protokoller
- [[_rules/deployment-cicd|Mobil Paketleme ve Test Kuralları]]
- [[_rules/git-workflow|Git Protokolleri]]
- [[_rules/code-quality|Kodlama Standartları]]
