# Köşe Kırpma Modülü (Corner Cropper)

- **Tür:** Modül | UI Bileşeni
- **Platform:** Mobil
- **Konum:** `apps/mobile/src/components/CornerCropper.tsx`
- **Bağlı Mimari:** [[architecture/mobile]], [[architecture/overview]]

## Sorumluluklar
- Başlangıçta rastgele kenar kaplamayan temiz tuval üzerinde kullanıcının tek parmakla çaprazlama çekerek kare/dikdörtgen okuma alanı oluşturmasını sağlar (Drag-to-box).
- Kutu oluşturulduktan sonra 4 köşe piniyle (`topLeft`, `topRight`, `bottomRight`, `bottomLeft`) hassas eğiklik/perspektif ayarı imkanı tanır.
- İki parmakla doğal büyütme ve küçültme (Pinch-to-zoom) ve tuvalde serbest kaydırma sağlar.
- Seçilen köşe koordinatlarına göre görseli orijinal piksel hassasiyetinde kırpar.
- Gazete listesinde ana ekrana dönmeden `◀ Önceki` ve `Sonraki ▶` butonlarıyla sıralı gezinme sunar.

## Arayüz & Metotlar
| Metot / Özellik | Parametre | Dönüş Tipi | Açıklama |
| :--- | :--- | :--- | :--- |
| `onCropComplete` | `primaryCroppedUri, zones, corners` | `void` | Kırpılan sütunları ve koordinatları iletir |
| `onPrevious / onNext` | `void` | `void` | Sıralı önceki ve sonraki gazeteye geçiş |
| `cropSingleRegion` | `cornersImgPx: CropCoordinatesDTO` | `Promise<string>` | Orijinal piksel koordinatlarına göre kırpılmış yeni görsel yolunu döndürür |

## İlgili Sözleşmeler & Kararlar
- [[contracts/api-endpoints]]
- [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]
- [[decisions/0003-coklu-sutun-sirali-ocr-akisi]]
- [[decisions/0004-klasor-manifesti-capraz-kutu-ve-pinch-zoom-akisi]]
