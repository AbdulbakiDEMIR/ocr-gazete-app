# ADR-0004: Klasör Manifesti, Çapraz Kutu Çizimi, Pinch-to-Zoom ve Sıralı Gazete Navigasyonu

- **Tarih:** 2026-10-08
- **Dosya Adı:** `decisions/0004-klasor-manifesti-capraz-kutu-ve-pinch-zoom-akisi.md`
- **Durum:** Kabul Edildi
- **İlgili Servisler:** [[entities/corner-cropper]], [[entities/folder-catalog-manager]], [[entities/ocr-service]]

## Bağlam ve Problem
Kullanıcının gazete arşivlerini verimli işleyebilmesi için pratik bir iş akışına ihtiyaç vardı:
1. Seçilen klasördeki tüm görseller taranmalı, OCR yapılan/yapılmayan durumları yerel veritabanının yanı sıra fiziksel bir durum/manifest dosyasına (`ocr_gazete_manifest.json`) kaydedilmelidir.
2. Sayfada gezinirken her seferinde listeye geri dönmek yerine gazete ekranında doğrudan "Önceki" ve "Sonraki" butonlarıyla geçiş yapılabilmelidir.
3. OCR alanı seçilirken sayfa kenarlarını rastgele kaplayan varsayılan kutular yerine; kullanıcı ekranda istediği noktaya basıp çaprazlama çekerek kare/dikdörtgen kutu oluşturabilmeli, ardından 4 köşe piniyle hassas eğiklik/perspektif ayarı yapabilmelidir.
4. Büyütme işlemi iki parmakla doğal olarak (pinch-to-zoom) yapılabilmelidir.

## Karar
1. **Fiziksel Durum Dosyası (Manifest):** `FolderCatalogService`, `AsyncStorage` ile birlikte `FileSystem.documentDirectory` altında `ocr_gazete_manifest.json` dosyasını her işlemde senkronize eder. Toplam gazete, OCR yapılan, bekleyen durumları tutulur.
2. **Çaprazlama Kutu Seçimi (Drag-to-Box Marquee):** Tuvalde başlangıçta varsayılan kutu konulmaz. Kullanıcı tek parmakla dokunup çaprazlama sürüklediğinde anlık dikdörtgen çizilir; bırakıldığında 4 köşe pini oluşturulur ve kullanıcı köşelerden hassas eğiklik ayarı yapabilir.
3. **İki Parmakla Yakınlaştırma (Pinch-to-Zoom):** İki parmak dokunuşu algılandığında Euclidean mesafe takip edilerek yakınlaştırma seviyesi 1.0x ile 3.5x arasında akıcı ölçeklenir; iki parmakla kaydırma yapılır.
4. **Sıralı Navigasyon ve Hızlı Geçiş:** Kırpma ekranının üst kısmına `◀ Önceki Gazete` | `sayfa.jpg (X / Y)` | `Sonraki Gazete ▶` navigasyonu eklendi. İnceleme modalına "✅ Onayla & Sonraki Gazeteye Geç" butonu eklenerek tek tıkla kaydetme ve bir sonraki gazeteyi açma akışı kuruldu.

## Sonuçlar
- **Artıları:**
  - Kullanıcı deneyimi olağanüstü hızlandı ve kolaylaştı.
  - Sütun seçimi saniyeler içine indi, gereksiz pin taşımaları ortadan kalktı.
  - Dosya bazlı manifest sayesinde dışa aktarma ve durum takibi şeffaflaştı.
- **Eksileri:**
  - PanResponder üzerinde çoklu dokunma (pinch) ve tekli dokunma (çizim) ayrımının hassas yönetilmesi gerekir.
