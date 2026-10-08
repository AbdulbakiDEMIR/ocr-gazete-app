# Gazete Tarama Modeli (Newspaper Scan)

- **Tür:** Model | Tablo
- **Platform:** Mobil
- **Konum:** `apps/mobile/src/models/newspaper-scan.ts`
- **Bağlı Mimari:** [[architecture/mobile]], [[architecture/overview]]

## Sorumluluklar
- Belirlenen klasörden alınan gazete görselinin referansını ve dosya adını tutar.
- Kullanıcının belirlediği köşe koordinatlarını ve kırpılmış kupür görselini ilişkilendirir.
- OCR işleminden elde edilen metin çıktısını ve kullanıcının inceleyip onayladığı nihai metni saklar.
- Kullanılan / kullanılmayan durumunu ve kataloglama meta verilerini temsil eder.

## Veri Modeli
| Alan | Tip | Açıklama |
| :--- | :--- | :--- |
| `id` | `string` | Benzersiz kayıt tanımlayıcı (UUID) |
| `fileName` | `string` | Orijinal gazete dosya adı (Kataloglama anahtarı) |
| `imageUri` | `string` | Kaynak orijinal gazete görsel yolu |
| `croppedImageUri`| `string` | Köşelerden kırpılmış kupür görsel yolu |
| `cropCorners` | `object` | Kullanıcının belirlediği 4 köşe koordinatı |
| `rawText` | `string` | OCR motorunun çıkardığı ham metin |
| `approvedText` | `string` | Kullanıcının onayladığı nihai metin |
| `status` | `string` | `UNPROCESSED` veya `PROCESSED` |
| `approvedAt` | `string` | Kullanıcı onay tarihi (ISO 8601) |

## İlgili Sözleşmeler & Kararlar
- [[contracts/api-endpoints]]
- [[decisions/0001-mobile-react-native-expo-ve-on-device-ocr]]
- [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]
