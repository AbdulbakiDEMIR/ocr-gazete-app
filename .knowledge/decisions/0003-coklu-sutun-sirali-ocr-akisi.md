# ADR-0003: Çoklu Sütun Seçimi ve Sıralı Gazete OCR Akışı

- **Tarih:** 2026-10-08
- **Dosya Adı:** `decisions/0003-coklu-sutun-sirali-ocr-akisi.md`
- **Durum:** Kabul Edildi
- **İlgili Servisler:** [[entities/corner-cropper]], [[entities/ocr-service]], [[entities/newspaper-scan]]

## Bağlam ve Problem
Gazeteler sayfa düzeni gereği dikey sütunlar halinde basılır. Standart OCR motorları tüm sayfaya veya geniş bir alana soldan sağa yatay tarama uyguladığında, yan yana duran farklı sütunlardaki satırları birbirine karıştırmakta ve cümlenin anlam bütünlüğü bozulmaktadır.

## Karar
1. **Çoklu Sütun/Bölge Seçimi (Multi-Zone Cropping):** Kullanıcı aynı gazete sayfasında sırayla birden fazla bölge/sütun (Örn: Sütun 1, Sütun 2, Sütun 3) seçebilir.
2. **Sıralı OCR İşleme:** Her sütun bağımsız olarak belirlenen köşelerden kırpılır ve OCR motoruna belirlenen okuma sırasıyla iletilir.
3. **Akıllı Metin Birleştirme:** Sütunlardan çıkarılan metinler, gazetenin doğal okunma sırasına göre ardışık olarak birleştirilir ve tek bir haber/makale metni oluşturulur.
4. **İnceleme & Katalog:** Kullanıcı tüm sütunların birleşimini ve görsellerini inceleyip onayladığında dosya adıyla kataloglanır.

## Sonuçlar
- **Artıları:**
  - Sütunların birbirine karışması %100 engellenir.
  - Gazete okuma akışına uygun kusursuz metin hiyerarşisi elde edilir.
  - Kullanıcı istediği sayıda sütunu tek seferde sırayla tarayabilir.
- **Eksileri:**
  - Çok sütunlu haberlerde her sütun için köşe seçimi adımı gerekir.
