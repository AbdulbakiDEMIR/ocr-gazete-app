# Klasör ve Katalog Yöneticisi (Folder & Catalog Manager)

- **Tür:** Servis | Modül
- **Platform:** Mobil
- **Konum:** `apps/mobile/src/services/folderCatalog.ts`
- **Bağlı Mimari:** [[architecture/mobile]], [[architecture/overview]]

## Sorumluluklar
- Kullanıcının cihazdan seçtiği gazete klasörünü (dizinini) okur ve içerisindeki görsel dosyalarını tarar.
- Görselleri iki gruba ayırır ve takip eder:
  - **Kullanılmayan Resimler (Unprocessed):** Henüz kırpılıp onaylanmamış bekleyen gazete sayfaları.
  - **Kullanılan Resimler (Processed):** Köşelerinden kırpılıp OCR işlemi kullanıcı tarafından onaylanmış gazete sayfaları.
- Durum ve katalog bilgilerini `AsyncStorage` ile birlikte kalıcı `ocr_gazete_manifest.json` dosyasına senkronize eder.
- Onaylanan OCR metnini, kaynak görselin dosya adını (fileName) kataloglama anahtarı olarak kullanarak kataloglar.
- Gazete listesinde sıralı gezinme için komşu görselleri (`getNeighborImages`) hesaplar.

## Arayüz & Metotlar
| Metot | Parametre | Dönüş Tipi | Açıklama |
| :--- | :--- | :--- | :--- |
| `getFolderManifest` | - | `Promise<FolderManifestDTO>` | Durum dosyasını ve istatistiklerini getirir |
| `getImagesByStatus` | `status: 'UNPROCESSED' \| 'PROCESSED'` | `Promise<ImageFolderItemDTO[]>` | Durumuna göre görselleri listeler |
| `saveApprovedCatalog` | `reviewData: OcrReviewDTO` | `Promise<CatalogRecordDTO>` | Dosya adıyla kataloglar, durumu günceller ve manifest dosyasına yazar |
| `getNeighborImages` | `images, currentImageId` | `{ prevImage, nextImage, currentIndex, totalCount }` | Önceki ve sonraki gazete geçiş nesnelerini döner |

## İlgili Sözleşmeler & Kararlar
- [[contracts/api-endpoints]]
- [[decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi]]
- [[decisions/0004-klasor-manifesti-capraz-kutu-ve-pinch-zoom-akisi]]
