# Oturum Notu: 2026-10-07 (Proje Onboarding ve Mobil Mimarisi Kurulumu)

- **Tarih:** 2026-10-07
- **Platform:** Mobil
- **İlgili Mimari:** [[architecture/mobile]], [[architecture/overview]]
- **İlgili Kararlar:** [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]], [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]
- **İlgili Servisler:** [[entities/newspaper-scan]], [[entities/ocr-service]], [[entities/corner-cropper]], [[entities/folder-catalog-manager]]

## 1. Yapılan İşlemler
- Kullanıcı talimatı doğrultusunda web platformu ve sunucu dağıtım (deploy) adımları projeden tamamen kaldırıldı.
- `apps/web/`, `.knowledge/architecture/web.md`, `.knowledge/sessions/web/` ve `.github/workflows/deploy.yml` silindi.
- `AGENTS.md` ve kural dosyaları (`_rules/deployment-cicd.md`, `_rules/multi-dev-sync.md`) salt mobil ve sunucusuz çalışma modeline uyarlandı.
- Kullanıcının belirlediği iş akışı mimariye dahil edildi:
  1. **Klasör ve Durum Yönetimi:** Belirlenen dizinden gazete görsellerinin okunması, `Kullanılan` ve `Kullanılmayan` durum takibi (`[[entities/folder-catalog-manager]]`).
  2. **Köşe Kırpma:** Görsel üzerinden kullanıcının 4 köşe pini ile kupürü kırpması (`[[entities/corner-cropper]]`).
  3. **OCR İşlemi:** Kırpılan alana Google ML Kit OCR uygulanması (`[[entities/ocr-service]]`).
  4. **Kullanıcı Onayı:** OCR çıktısının kullanıcıya gösterilerek onay/düzeltme istenmesi.
  5. **Dosya Adı ile Kataloglama:** Onaylanan kaydın görsel dosya adı anahtarıyla indekslenmesi ve arşivlenmesi.
- İlgili varlıklar ve yeni mimari karar kaydı (`[[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]`) bilgi grafiğine işlendi.
- `apps/mobile/` dizininde React Native Expo TypeScript projesi ve temel paketler (`@react-native-async-storage/async-storage`, `expo-image-manipulator`, `expo-document-picker`) kuruldu.
- `apps/mobile/src/types/index.ts` ile tüm veri sözleşmeleri ve DTO modelleri tanımlandı.
- `apps/mobile/src/services/folderCatalog.ts` ile klasör okuma, kullanılan/kullanılmayan durumu ve dosya adına göre kataloglama servisi kodlandı.
- `apps/mobile/src/services/ocr.ts` ile gazete görselini Base64'e dönüştürüp Türkçe gazete dil modeliyle işleyen gerçek OCR motoru (OCR.Space Engine 2) entegre edildi; çevrimdışı fallback mekanizması eklendi.
- `apps/mobile/src/components/CornerCropper.tsx` çoklu sütun seçimiyle genişletildi: Kullanıcı sırayla gazete sütunlarını işaretleyip (`1. Sütun`, `2. Sütun`...) ekleyebilir; önceki sütunlar yeşil kesikli çizgilerle ekranda kalır.
- `apps/mobile/App.tsx` ve `src/services/ocr.ts`: Seçilen sütunlar gazete okuma sırasıyla ardışık olarak kırpılır ve OCR motoruna gönderilir; çıkarılan metinler sütun başlıklarıyla düzenli bir haber metni olarak birleştirilir.
- `apps/mobile/src/components/CornerCropper.tsx`: Gazetedeki küçük sütun yazılarını rahatça okuyup seçebilmek için 1.0x, 1.5x, 2.0x ve 2.5x dinamik yakınlaştırma (Zoom) kontrolü eklendi; koordinatlar normalize edilerek her zoom seviyesinde milimetrik köşe seçimi sağlandı.
- `apps/mobile/src/components/ReviewModal.tsx`: Kırpılan her sütunun görseli yatay şeritte önizlenir ve birleştirilmiş metin kullanıcı onayına sunulur.
- `npx tsc --noEmit` ile TypeScript derleme testi başarıyla 0 hata ile doğrulandı.

## 2. Alınan Kararlar
- [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]: React Native (Expo), Cihaz İçi ML Kit OCR ve Sunucusuz Mobil Mimari kararı kabul edildi.
- [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]: 4 Köşeli Kırpma, Kullanıcı Onayı ve Dosya Adı Tabanlı Kataloglama Akışı kabul edildi.
- [[decisions/0003-coklu-sutun-sirali-ocr-akisi]]: Çoklu Sütun Seçimi ve Sıralı Gazete OCR Akışı kararı kabul edildi.

## 3. Sıradaki Adımlar (Next Steps)
- Uygulamanın Expo Go veya fiziksel test cihazında/emülatörde çalıştırılarak kullanıcı arayüzü deneyiminin test edilmesi (`npx expo start`).
- Gerekirse ekstra filtreleme, dışa aktarma (JSON/TXT/PDF) veya kullanıcı istekleri doğrultusunda ek özelliklerin eklenmesi.
