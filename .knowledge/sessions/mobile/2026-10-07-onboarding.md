# Oturum Notu: 2026-10-07 (Proje Onboarding ve Mobil Mimarisi Kurulumu)

- **Tarih:** 2026-10-07
- **Platform:** Mobil
- **İlgili Mimari:** [[architecture/mobile]], [[architecture/overview]]
- **İlgili Kararlar:** [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]
- **İlgili Servisler:** [[entities/newspaper-scan]], [[entities/ocr-service]]

## 1. Yapılan İşlemler
- Kullanıcı talimatı doğrultusunda web platformu ve sunucu dağıtım (deploy) adımları projeden tamamen kaldırıldı.
- `apps/web/`, `.knowledge/architecture/web.md`, `.knowledge/sessions/web/` ve `.github/workflows/deploy.yml` silindi.
- `AGENTS.md` ve kural dosyaları (`_rules/deployment-cicd.md`, `_rules/multi-dev-sync.md`) salt mobil ve sunucusuz çalışma modeline uyarlandı.
- Proje mimarisi belirlendi:
  - **Framework:** React Native (Expo)
  - **OCR:** Google ML Kit cihaz içi yerel metin tanıma (çevrimdışı ve sıfır sunucu bağımlılığı)
  - **Depolama:** SQLite / AsyncStorage ile yerel gazete kupürü arşivi
- İlgili varlıklar (`[[entities/newspaper-scan]]`, `[[entities/ocr-service]]`) ve mimari karar kaydı (`[[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]`) bilgi grafiğine işlendi.
- `python scripts/vault-lint.py --strict` çalıştırılarak bilgi grafiği sıfır hata ve sıfır uyarı ile doğrulandı.

## 2. Alınan Kararlar
- [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]: React Native (Expo), Cihaz İçi ML Kit OCR ve Sunucusuz Mobil Mimari kararı kabul edildi.

## 3. Sıradaki Adımlar (Next Steps)
- `apps/mobile/` dizininde React Native Expo proje yapısını ve bağımlılıklarını kurmak.
- Kamera ve galeri görsel seçici (expo-image-picker / expo-camera) entegrasyonu.
- Google ML Kit OCR servisini yapılandırmak.
- Taranan gazete kupürlerini listeleyen ve detayını gösteren sade arayüz ekranlarını geliştirmek.
