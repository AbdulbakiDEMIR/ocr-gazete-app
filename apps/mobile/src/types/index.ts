export interface Point {
  x: number;
  y: number;
}

export interface CropCoordinatesDTO {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface CropRegionItem {
  id: string;
  order: number;
  label: string;
  corners: CropCoordinatesDTO;
  croppedUri?: string;
  ocrText?: string;
}

export type ImageStatus = 'UNPROCESSED' | 'PROCESSED';

export interface ImageFolderItemDTO {
  id: string;
  fileName: string;              // Örn: '1985-05-12_milliyet_sayfa1.jpg'
  fileUri: string;               // Cihazdaki görsel dosya yolu
  status: ImageStatus;           // Kullanılan veya kullanılmayan görsel durumu
  updatedAt: string;
  fileSizeBytes?: number;
  ocrSnippet?: string;           // OCR metninden özet bilgi
}

export interface FolderManifestDTO {
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

export interface OcrReviewDTO {
  fileName: string;              // Kaynak dosya adı
  originalUri: string;           // Orijinal gazete görseli yolu
  croppedUri: string;            // Ana veya birleştirilmiş gazete kupürü görseli
  croppedUris?: string[];        // Çoklu sütun kırpıntı görselleri listesi
  zones?: CropRegionItem[];      // Sütun bölgeleri ve ayrı ayrı OCR çıktıları
  cropCoordinates: CropCoordinatesDTO;
  rawOcrText: string;            // Ham veya sütun sırasıyla birleştirilmiş OCR metni
  editedOcrText?: string;        // Kullanıcının inceleme anında düzelttiği metin
  isApproved: boolean;           // Kullanıcı onayı
}

export interface CatalogRecordDTO {
  id: string;                    // UUID
  fileName: string;              // Dosya adı (Kataloglama anahtarı)
  sourceDirectory?: string;      // Kaynak klasör yolu
  originalImageUri: string;      // Orijinal gazete görseli yolu
  croppedImageUri: string;       // Kırpılmış gazete parçası görsel yolu
  finalText: string;             // Onaylanmış metin içeriği
  approvedAt: string;            // Onay tarihi (ISO 8601)
  status: 'PROCESSED';
}
