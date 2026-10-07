# OCR Gazete App - Bilgi Grafiği

Bu dosya sistemin giriş kapısıdır. İlgili bağlantıları takip ederek detaylara ulaşabilirsiniz.

## 🧭 Sistem Mimarisi
- [[architecture/overview|Genel Sistem Mimarisi]]: Çevrimdışı ve bağımsız mobil mimari genel bakışı
- [[architecture/mobile|Mobil Mimarisi]]: React Native Expo mobil uygulama mimari detayları

## 📦 Çekirdek Servisler & Modeller
- [[entities/newspaper-scan|Gazete Tarama Modeli]]: Taranan gazete kupürleri ve arşiv veri modeli
- [[entities/ocr-service|Yerel OCR Servisi]]: Google ML Kit cihaz içi metin tanıma motoru

## 📋 Kurallar & Standartlar
- [[_rules/git-workflow|Git Protokolleri]]: Git branch ve commit standartları
- [[_rules/multi-dev-sync|Geliştirici Protokolü]]: Oturum ve geliştirici kuralları
- [[_rules/deployment-cicd|Mobil Paketleme Kuralları]]: Mobil test ve paketleme standartları (deploy yok)
- [[_rules/code-quality|Kodlama Standartları]]: Kod kalitesi ve stil kılavuzu

## 🔌 Sözleşmeler & Modeller
- [[contracts/api-endpoints|Veri Sözleşmeleri]]: Cihaz içi veri modelleri ve DTO tanımları

## 📜 Oturum Geçmişi & Kararlar
- [[decisions/README|Mimari Karar Kayıtları (ADR)]]: Alınan mimari kararlar
- [[sessions/README|Genel Oturumlar]]: Platformdan bağımsız oturum özetleri
- [[sessions/mobile/README|Mobil Oturumları]]: Mobil oturum özetleri

## 🧩 Protokoller & Şablonlar
- [[_schema/onboarding-guide|Onboarding Protokolü]]: Yeni projenin kurulum adımları
- [[_schema/ingest-guide|Ingest Protokolü]]: Inbox dokümanlarını grafa işleme
- [[_schema/conventions|Yazım Kuralları]]: Dosya adlandırma, bağlantı ve placeholder kuralları
- [[_schema/entity-template|Entity Şablonu]] · [[_schema/adr-template|ADR Şablonu]]
