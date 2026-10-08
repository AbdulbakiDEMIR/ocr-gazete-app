# Veri Sözleşmeleri ve Modeller (Contracts)

Bu proje bağımsız (standalone) bir mobil uygulama olduğu için harici bir sunucu API'si yerine cihaz içi servis arayüzleri ve veri transfer nesneleri (DTO / Modeller) tanımlanmıştır.

- **Üst Mimari:** [[architecture/overview]]
- **İlgili Servisler:** [[entities/newspaper-scan|Gazete Tarama Modeli]], [[entities/ocr-service|Yerel OCR Servisi]], [[entities/corner-cropper|Köşe Kırpma Modülü]], [[entities/folder-catalog-manager|Klasör ve Katalog Yöneticisi]]

## 1. Mimari Durumu
- **Sunucu & Base URL:** Yok (Cihaz içi çevrimdışı çalışma modu)
- **Depolama Biçimi:** JSON / SQLite yerel kayıtları

---

## 2. Veri Tipleri ve Modeller

### A. Klasör Görsel Öğesi ve Manifest Modeli (`ImageFolderItemDTO`, `FolderManifestDTO`)
```typescript
interface ImageFolderItemDTO {
  fileName: string;              // Dosya adı (Örn: '1985-05-12_milliyet_sayfa1.jpg')
  fileUri: string;               // Cihazdaki mutlak veya yerel dosya yolu
  status: 'UNPROCESSED' | 'PROCESSED'; // Kullanılan veya kullanılmayan görsel durumu
  updatedAt: string;
  ocrSnippet?: string;           // OCR metninden özet alıntı
}

interface FolderManifestDTO {
  folderName: string;
  folderPath: string;
  manifestFilePath: string;
  lastUpdated: string;
  stats: {
    total: number;
    processed: number;
    unprocessed: number;
  };
  images: ImageFolderItemDTO[];
}
```

### B. Köşe Kırpma ve Çoklu Sütun Bölgeleri (`CropCoordinatesDTO`, `CropRegionItemDTO`)
```typescript
interface Point {
  x: number;
  y: number;
}

interface CropCoordinatesDTO {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

interface CropRegionItemDTO {
  id: string;                    // Bölge tekil ID (Örn: 'zone-1')
  order: number;                 // Okunma/taranma sırası (1, 2, 3...)
  label: string;                 // Başlık (Örn: '1. Sütun', '2. Sütun')
  corners: CropCoordinatesDTO;   // 4 Köşe koordinatı
  croppedUri?: string;           // Kırpılmış sütun görsel yolu
  ocrText?: string;              // Bu sütundan çıkarılan metin
}
```

### C. OCR Onay İnceleme Modeli (`OcrReviewDTO`)
```typescript
interface OcrReviewDTO {
  fileName: string;              // Kaynak dosya adı
  originalUri: string;           // Orijinal gazete görseli yolu
  croppedUri: string;            // Ana veya birleştirilmiş gazete kupürü görseli
  croppedUris?: string[];        // Çoklu sütun kırpıntı görselleri listesi
  zones?: CropRegionItemDTO[];   // Sütun bölgeleri ve ayrı ayrı OCR çıktıları
  cropCoordinates: CropCoordinatesDTO;
  rawOcrText: string;            // Ham veya sütun sırasıyla birleştirilmiş OCR metni
  editedOcrText?: string;        // Kullanıcının inceleme anında düzelttiği metin
  isApproved: boolean;           // Kullanıcı onayı
}
```

### D. Katalog Kaydı (`CatalogRecordDTO`)
```typescript
interface CatalogRecordDTO {
  id: string;                    // UUID
  fileName: string;              // Dosya adı (Kataloglama anahtarı)
  sourceDirectory: string;       // Kaynak klasör yolu
  croppedImageUri: string;       // Kırpılmış gazete parçası görsel yolu
  finalText: string;             // Onaylanmış metin içeriği
  approvedAt: string;            // Onay tarihi (ISO 8601)
  status: 'PROCESSED';
}
```
