# Dağıtım ve Mobil Paketleme Kuralları

Bu projede harici bir sunucu, Docker konteyner dağıtımı veya Traefik reverse proxy mimarisi **bulunmamaktadır**. Proje, bağımsız (standalone) bir mobil uygulama olarak geliştirilmektedir.

## 1. Sunucu ve Deploy Durumu
- **Sunucu Dağıtımı Yok:** GCP VM, Traefik, Docker Compose veya SSH tabanlı sunucu deploy adımları bu projede işletilmez.
- **GitHub Actions Deploy:** `.github/workflows/deploy.yml` kaldırılmıştır. Sunucu dağıtım tetikleyicisi bulunmaz.

## 2. Mobil Uygulama Paketleme & Test Standartları
- Mobil geliştirme `apps/mobile/` dizini altında gerçekleştirilir.
- Test ve çalıştırma işlemleri yerel ortamda (simülatör, emülatör veya fiziksel test cihazı) yürütülür.
- İleride gereksinim duyulursa mağaza sürümü (APK / AAB / IPA) veya Expo EAS / Fastlane gibi mobil derleme araçları kullanılacaktır.
- Hassas konfigürasyonlar (API anahtarları, servis anahtarları) doğrudan Git'e commit edilmemeli, `.env` veya ortam değişkenleri üzerinden yönetilmelidir.
