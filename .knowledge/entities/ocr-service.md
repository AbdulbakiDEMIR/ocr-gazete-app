# Yerel OCR Servisi (OCR Service)

- **Tür:** Servis | Modül
- **Platform:** Mobil
- **Konum:** `apps/mobile/src/services/ocr.ts`
- **Bağlı Mimari:** [[architecture/mobile]], [[architecture/overview]]

## Sorumluluklar
- Gazete fotoğraflarını Google ML Kit Text Recognition motoruna ileterek optik karakter tanıma uygular.
- Taranan görüntüyü metin blokları, satırlar ve kelimeler seviyesinde ayrıştırır.
- Çevrimdışı ve sıfır gecikmeyle cihaz üzerinde çalışır, harici sunucuya veri göndermez.
- Düşük kaliteli veya eğik gazete fotoğrafları için temel ön işleme (kırpma/kontrast) desteği sağlar.

## Arayüz & Metotlar
| Metot | Parametre | Dönüş Tipi | Açıklama |
| :--- | :--- | :--- | :--- |
| `recognizeText` | `imageUri: string` | `Promise<OcrResultDTO>` | Görüntüdeki metni ve blokları çıkarır |
| `cleanText` | `rawText: string` | `string` | Karakter hatalarını ve satır sonlarını normalize eder |

## İlgili Sözleşmeler & Kararlar
- [[contracts/api-endpoints]]
- [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]
- [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]
