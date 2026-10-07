# Veri Sözleşmeleri ve Modeller (Contracts)

Bu proje bağımsız (standalone) bir mobil uygulama olduğu için harici bir sunucu API'si yerine cihaz içi servis arayüzleri ve veri transfer nesneleri (DTO / Modeller) tanımlanmıştır.

- **Üst Mimari:** [[architecture/overview]]
- **İlgili Servisler:** [[entities/newspaper-scan|Gazete Tarama Modeli]], [[entities/ocr-service|Yerel OCR Servisi]]

## 1. Mimari Durumu
- **Sunucu & Base URL:** Yok (Cihaz içi çevrimdışı çalışma modu)
- **Depolama Biçimi:** JSON / SQLite yerel kayıtları

---

## 2. Veri Tipleri ve Modeller

### A. Gazete Tarama Kaydı (`NewspaperScanDTO`)
```typescript
interface NewspaperScanDTO {
  id: string;              // UUID veya benzersiz kimlik
  title: string;           // Kullanıcı başlığı veya otomatik tarih başlığı
  imageUri: string;        // Cihazdaki yerel resim dosya yolu
  rawText: string;         // OCR ile çıkarılan tam metin
  blocks: OcrBlockDTO[];   // Paragraf/blok bazlı koordinat ve metinler
  createdAt: string;       // ISO 8601 tarih formatı
  tags?: string[];         // İsteğe bağlı etiketler (Örn: 'Manşet', 'Ekonomi')
}
```

### B. OCR Blok Çıktısı (`OcrBlockDTO`)
```typescript
interface OcrBlockDTO {
  text: string;            // Blok metni
  confidence?: number;     // Güven skoru (0 - 1 arası)
  boundingBox?: {          // Görüntü koordinatları
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```
