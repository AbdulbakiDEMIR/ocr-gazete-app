# ADR-0002: Köşe Kırpma, Kullanıcı Onayı ve Dosya Adı Tabanlı Kataloglama Akışı

- **Tarih:** 2026-10-07
- **Dosya Adı:** `decisions/0002-kose-kirpma-dosya-adi-kataloglama-ve-onay-akisi.md`
- **Durum:** Kabul Edildi
- **İlgili Servisler:** [[entities/corner-cropper]], [[entities/ocr-service]], [[entities/folder-catalog-manager]], [[entities/newspaper-scan]]

## Bağlam ve Problem
Gazete sayfaları çok sütunlu, büyük ve karmaşık sayfa düzenlerine sahiptir. Tüm sayfaya doğrudan OCR uygulamak gürültülü metin çıktısına yol açar. Ayrıca kullanıcının belirlediği bir klasördeki gazete fotoğraflarının işlenme durumunun (`Kullanılan` vs `Kullanılmayan`) takip edilmesi, OCR sonucunun insan kontrolünden (onayından) geçmesi ve onaylanan metnin dosya adına göre arşivlenmesi gerekmektedir.

## Karar
1. **Köşe Kırpma (Corner Cropping):** Gazete görseli üzerinde kullanıcıya 4 hareketli köşe pini sunulacak ve kullanıcı kupür alanını belirleyecektir. OCR yalnızca bu kırpılmış alana uygulanacaktır.
2. **Kullanıcı İnceleme & Onay Döngüsü (Review & Approval):** OCR işlemi tamamlandıktan sonra sonuç hemen kaydedilmeyecek; kullanıcı arayüzünde kırpılmış görsel ve çıkarılan metin yan yana gösterilerek kullanıcıdan onay istenecektir.
3. **Dosya Adı Tabanlı Kataloglama:** Onaylanan metin ve görsel verisi, kaynak dosyanın adı (fileName) anahtar olarak kullanılarak katalog kayıtlarına eklenecektir.
4. **Klasör Durum Yönetimi:** Belirlenen dizindeki resimler "Kullanılan (İşlenmiş)" ve "Kullanılmayan (Bekleyen)" olarak filtrelenip listelenecektir.

## Sonuçlar
- **Artıları:**
  - Sayfa gürültüsü engellenir, yalnızca hedeflenen gazete kupürü taranır.
  - İnsan denetimi ile hatalı OCR çıktıları önlenir ve düzeltme imkanı tanınır.
  - Klasördeki gazete arşivinin işlenme durumu net biçimde takip edilir.
  - Dosya adı ile kataloglama sayesinde fiziksel dosya ve dijital metin birebir eşleşir.
- **Eksileri:**
  - Kullanıcı etkileşimi (köşe sürükleme ve onaylama) ek adımlar gerektirir.
