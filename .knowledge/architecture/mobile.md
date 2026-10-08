# Mobil Mimarisi
 
- **Konum:** `apps/mobile/`
- **Framework:** React Native (Expo)
- **Kırpma Modülü:** 4 Noktalı İnteraktif Köşe Kırpıcı (`[[entities/corner-cropper]]`)
- **OCR Motoru:** Cihaz içi OCR (`[[entities/ocr-service]]` - Google ML Kit Text Recognition)
- **Klasör & Kataloglama:** Yerel Klasör Yöneticisi (`[[entities/folder-catalog-manager]]`)
- **Offline Depolama:** Cihaz İçi SQLite / AsyncStorage (Katalog ve Durum Takibi)
- **Navigasyon:** Expo Router / React Navigation
- **Üst Mimari:** [[architecture/overview]]
- **İlgili Sözleşmeler & Tipler:** [[contracts/api-endpoints]]

## Ekran Akışı
1. **Klasör ve Görsel Listesi:** Kullanıcının seçtiği klasördeki `Kullanılmayan (Bekleyen)` ve `Kullanılan (İşlenmiş)` görseller listelenir.
2. **Köşe Kırpma:** Seçilen gazete sayfasında 4 köşe pini ayarlanarak kupür alanı kırpılır.
3. **OCR İnceleme & Onay:** Kırpılan görsel üzerinden OCR çalıştırılır; çıkarılan metin kullanıcıya gösterilir ve onay/düzeltme istenir.
4. **Kataloglama & Kaydetme:** Onaylanan kayıt görselin dosya adıyla indekslenir; görsel `Kullanılan` olarak işaretlenir.

## Varlıklar & Servisler
- [[entities/newspaper-scan|Gazete Tarama Modeli]]
- [[entities/ocr-service|Yerel OCR Servisi]]
- [[entities/corner-cropper|Köşe Kırpma Modülü]]
- [[entities/folder-catalog-manager|Klasör ve Katalog Yöneticisi]]
