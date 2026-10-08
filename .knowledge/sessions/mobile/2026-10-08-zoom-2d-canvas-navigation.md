# 2026-10-08: Tuvalde Çift Yönlü (2D) Gezinme ve Yakınlaştırma İyileştirmesi

## Yapılan İyileştirmeler
1. **Çift Yönlü (Yatay + Dikey) Tuval Gezinmesi:**
   - Gazete kırpıcı bileşeninde (`CornerCropper.tsx`) yakınlaştırma modu devredeyken (1.5x, 2.0x, 2.5x) tuval alanı iç içe dikey ve yatay `ScrollView` bileşenleriyle donatıldı (`nestedScrollEnabled={true}`).
   - Kullanıcı büyütülmüş gazete sayfasında artık hem yatay hem dikey eksende parmağıyla serbestçe dolaşabiliyor.
2. **Köşe Pini Sürükleme İzolasyonu (`isDraggingPin`):**
   - Kullanıcı 4 köşe pinini ayarlarken sayfa ve tuval kaydırmasının kilitlenmesi sağlandı. Böylece pin sürükleme esnasında ekranın yanlışlıkla kayması engellendi.
3. **Pencere Boyutlandırması (Viewport Constraints):**
   - Tuval sarmalayıcısına sabit sınırlandırma verilerek sayfa dışına taşma ve dikey kilitlenme sorunları giderildi.
4. **Orijinal Fotoğraf Piksellerine Tam Sabitleme (Pixel-Anchor Coordinate System):**
   - Hem aktif seçili köşe koordinatları (`imageCorners`) hem de kaydedilen sütun bölgeleri (`zones.corners`) doğrudan görselin orijinal piksel koordinatlarında (`0..origWidth, 0..origHeight`) tutulacak şekilde yeniden yapılandırıldı.
   - Büyütme seviyesi (1.0x, 1.5x, 2.0x, 2.5x) değiştirildiğinde veya pencere boyutu değiştiğinde ekrandaki kutu ve pinler fotoğrafın gerçek pikselleriyle dinamik olarak ölçeklenir; kırpma alanı gazetede seçilen kelimelerin üzerinden asla kaymaz.
   - Kırpma işlemi (`cropSingleRegion`) doğrudan orijinal görsel pikselleri üzerinden çalıştığından kırpma çıktısı %100 doğrulukla tam hedeflenen bölgeyi alır.

## İlgili Bağlantılar
- [[entities/corner-cropper|Köşe Kırpma Servisi]]
- [[architecture/mobile|Mobil Uygulama Mimarisi]]

## Sonraki Adımlar (Next Steps)
- Kullanıcının çoklu sütun sırası ve OCR netliği üzerindeki geri bildirimlerini test etmek.
- Farklı gazete çözünürlüklerinde 2D kaydırma akıcılığını izlemek.
