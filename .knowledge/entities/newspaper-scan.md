# Gazete Tarama Modeli (Newspaper Scan)

- **Tür:** Model | Tablo
- **Platform:** Mobil
- **Konum:** `apps/mobile/src/models/newspaper-scan.ts`
- **Bağlı Mimari:** [[architecture/mobile]], [[architecture/overview]]

## Sorumluluklar
- Kameradan veya galeriden alınan gazete kupürü görüntüsünün yerel referansını tutar.
- OCR işleminden elde edilen metin çıktısını ve blok bilgilerini saklar.
- Kullanıcı tarafından verilen başlık, etiket ve tarih meta verilerini yönetir.
- SQLite / yerel depolama üzerinde taranan gazete arşiv kayıtlarını temsil eder.

## Veri Modeli
| Alan | Tip | Açıklama |
| :--- | :--- | :--- |
| `id` | `string` | Benzersiz kayıt tanımlayıcı (UUID) |
| `title` | `string` | Gazete veya kupür başlığı |
| `imageUri` | `string` | Yerel cihaz dosya sistemindeki görsel yolu |
| `rawText` | `string` | OCR ile taranmış ham metin |
| `blocks` | `array` | Paragraf ve blok koordinat detayları |
| `createdAt` | `string` | Kaydın oluşturulma tarihi (ISO 8601) |
| `tags` | `array` | İsteğe bağlı kategori veya arama etiketleri |

## İlgili Sözleşmeler & Kararlar
- [[contracts/api-endpoints]]
- [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]
