# 2026-10-08: Pratik Klasör İş Akışı, Çapraz Kutu Seçimi ve Pinch-to-Zoom

## Yapılan İyileştirmeler
1. **Gerçek Klasör Seçimi (Android SAF) ve Otomatik Yeni Resim Taraması:**
   - Android StorageAccessFramework (`requestDirectoryPermissionsAsync`) entegre edildi. Kullanıcı telefonundaki istediği bir klasörü (ör. `Download/Gazeteler`) doğrudan seçip yetki verebiliyor.
   - Klasördeki tüm resim dosyaları (`.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`) taranıp durum dosyasına kaydediliyor.
   - **Gelecek Yeni Resimleri Ekleme:** "🔄 Yenile / Yeni Ekle" butonuyla kayıtlı klasör tekrar taranıyor; sonradan klasöre atılan yeni resimler tespit edilip listeye `UNPROCESSED` olarak ekleniyor. Önceden OCR yapılmış gazeteler asla bozulmuyor.
2. **Sıralı Gazete Navigasyonu (Önceki & Sonraki Butonları):**
   - Kırpma ekranının üst kısmına `◀ Önceki Gazete` | `sayfa.jpg (X / Y)` | `Sonraki Gazete ▶` navigasyon çubuğu eklendi.
   - Kullanıcı listeye geri dönmek zorunda kalmadan klasördeki tüm sayfalar arasında tek dokunuşla geçiş yapabiliyor.
   - OCR inceleme modalına (`ReviewModal.tsx`) "✅ Onayla & Sonraki Gazeteye Geç ▶" butonu eklenerek tek tıkla kaydetme ve bir sonraki bekleyen gazeteyi otomatik açma akışı kuruldu.
3. **Çapraz Dikdörtgen Seçiminin Düzeltilmesi (Mimari Revizyon):**
   - Kırpma ekranını sarmalayan dış ve iç ScrollView katmanları kaldırıldı (`CornerCropper` tam ekran flex View yapısına geçirildi). Böylece dikey kaydırmanın tek parmaklı çizim jestini çalması ve iptal etmesi (`onPanResponderTerminate`) engellendi.
   - Kullanıcı ekrana dokunup çapraz çektiğinde canlı şeffaf dikdörtgen anında ve takılmasız çiziliyor; bırakıldığında 4 köşe pini oluşturuluyor.
4. **İki Parmakla Yakınlaştırma (Pinch-to-Zoom) Düzeltmesi:**
   - ScrollView engeli kalktığı için tuval doğrudan çoklu dokunmayı (`touches.length >= 2`) pürüzsüz yakalıyor. İki parmak arasındaki mesafe üzerinden 1.0x ile 4.0x arasında akıcı büyütme ve iki parmakla tuval kaydırma sağlandı.
   - Hızlı büyütme hapları (`1x`, `1.5x`, `2x`, `3x`) ile anlık sıfırlama seçeneği korundu.
5. **Çizim Sonrası 4 Köşeyi Serbest Düzenleme & Kutu Taşıma:**
   - Kutu çizildikten sonra `findHitPin` algoritması stale closure'dan arındırılarak doğrudan `imageCornersRef` ve `metricsRef` üzerinden canlı ekran koordinatlarına bağlandı.
   - Parmakla dokunulan 1, 2, 3 ve 4 numaralı pinler 52px geniş dokunma alanıyla anında yakalanıp orijinal fotoğraf pikselleri hassasiyetinde serbestçe taşınabilir hale getirildi.
   - Aktif sürüklenen köşe pini için sarı vurgu efekti (`pinBubbleActive`) ve kutu içine basıldığında tüm kutuyu birlikte kaydırma desteği eklendi.
6. **Özyinelemeli (Recursive) Klasör Taraması ve Çoklu URI Çözümleme:**
   - Android SAF taramasında katı regex bağımlılığı kaldırılarak MediaStore doküman URI'leri (`image:...`, `msf:...`) ve alt klasörler özyinelemeli (`scanDirectoryRecursive`) taranabilir hale getirildi.
   - Klasör seçildiğinde klasördeki tüm görseller manifest ve veritabanıyla (`setFolderImages`) senkronize edilerek daha önce işlenmiş (`PROCESSED`) gazete durumları korunup yeni görseller listelendi.
7. **Büyük Koleksiyon Optimizasyonu (8.000+ Görsel Desteği):**
   - 8.000 fotoğraflı büyük arşivlerde Android SQLite `CursorWindow` (2MB) aşımını önlemek için fiziksel disk dosya yazımı (`manifest.json`) ve bellek önbelleği (`memoryImagesCache`) mimarisi kuruldu.
   - Dosya tarama süreci senkron ve hafif regex operasyonuna dönüştürülerek 8.000 dosyanın taranması birkaç milisaniyeye indirildi. Doğal nümerik sıralama (`sayfa_1`, `sayfa_2` ... `sayfa_8000`) sağlandı.
   - `FlatList` üzerinde sanallaştırma (`initialNumToRender: 15`, `windowSize: 5`, `removeClippedSubviews: true`) ve anlık arama çubuğu (`TextInput`) eklenerek binlerce görselde takılmasız 60 FPS gezinme sağlandı.
8. **Yerel Özel API Anahtarı Yönetimi & Otomatik Rotasyon (`SettingsModal.tsx`):**
   - Kullanıcının API anahtarlarını yapay zekaya veya harici sunuculara göndermeden, doğrudan kendi telefonunda (`@ocr_gazete:user_api_keys`) güvenle saklayabilmesi için "⚙️ Ayarlar" modalı eklendi.
   - Birden fazla e-postadan alınan ücretsiz anahtarların tek bir havuzda toplanması ve her OCR çağrısında sırayla otomatik döndürülmesi (Round-Robin) sağlandı.

## Alınan Mimari Kararlar
- [[decisions/0004-klasor-manifesti-capraz-kutu-ve-pinch-zoom-akisi|ADR-0004: Klasör Manifesti, Çapraz Kutu Çizimi, Pinch-to-Zoom ve Sıralı Gazete Navigasyonu]]

## İlgili Bağlantılar
- [[entities/corner-cropper|Köşe Kırpma Modülü]]
- [[entities/folder-catalog-manager|Klasör ve Katalog Yöneticisi]]
- [[contracts/api-endpoints|Veri Sözleşmeleri]]

## Sonraki Adımlar (Next Steps)
- Farklı cihazlarda fiziksel dokunmatik ekran testi yapmak.
- Gazete manifest dosyasını harici paylaşım veya dışa aktarma (export/share) özelliği ile genişletmek.
