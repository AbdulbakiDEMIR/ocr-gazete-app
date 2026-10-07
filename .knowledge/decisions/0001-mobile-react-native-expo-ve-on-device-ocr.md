# ADR-0001: React Native (Expo), Cihaz İçi ML Kit OCR ve Sunucusuz Mobil Mimari

- **Tarih:** 2026-10-07
- **Dosya Adı:** `decisions/0001-mobile-react-native-expo-ve-on-device-ocr.md`
- **Durum:** Kabul Edildi
- **İlgili Servisler:** [[entities/newspaper-scan]], [[entities/ocr-service]]

## Bağlam ve Problem
Kullanıcı projenin sadece basit bir mobil uygulama olacağını, web platformunun ve sunucu/deploy adımlarının bulunmayacağını belirtti. Gazete kupürlerinin fotoğraflanıp metne dönüştürülmesi gerekiyor.

## Karar
1. **Platform & Framework:** Mobil platform için React Native (Expo) seçildi. Web uygulaması ve sunucu altyapısı projeden tamamen çıkarıldı.
2. **OCR Çözümü:** Cihaz üzerinde yerel Google ML Kit Text Recognition seçildi. Veriler harici sunucuya iletilmeden doğrudan cihazda işlenecektir.
3. **Depolama:** Taranan gazete arşiv kayıtları cihaz içi yerel SQLite / AsyncStorage yapısında saklanacaktır.
4. **Dağıtım (Deploy):** GCP, Traefik, Docker Compose ve SSH deploy adımları devreden çıkarıldı.

## Sonuçlar
- **Artıları:**
  - Tamamen çevrimdışı çalışabilme ve sıfır sunucu maliyeti.
  - Hızlı prototipleme ve sadeleştirilmiş mobil kod tabanı.
  - Karmaşık sunucu ve bulut dağıtım bakım yükünden muafiyet.
- **Eksileri:**
  - Cihaz donanım gücüne ve kütüphane desteğine bağlı OCR performansı.
