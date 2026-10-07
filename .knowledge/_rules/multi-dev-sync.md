# Çoklu Geliştirici ve Oturum Eşzamanlama Protokolü

1. **Sözleşme Önceliği (Contract-First):**
   - Harici servis veya backend entegrasyonu gerektiğinde endpoint veya veri modeli değişiklikleri doğrudan `.knowledge/contracts/api-endpoints.md` içine yazılır.
   - Mobil uygulama tarafındaki geliştirici veya LLM, veri çağrılarını ve modelleri doğrudan `contracts/api-endpoints.md` dosyasına bakarak üretir.

2. **Oturum Notlarının Yapısı:**
   - Mobil uygulama oturum özetleri: `.knowledge/sessions/mobile/`
   - Platformdan bağımsız genel işler: `.knowledge/sessions/`
   - Her oturum dosyası `<YYYY-MM-DD>-<kisa-konu>.md` şeklinde adlandırılır (sıra numarası kullanılmaz). Bu sayede paralel geliştiriciler arasında dosya adı çakışması önlenir.

3. **İşe Başlama Protokolü (Pull-Before-Work):**
   - LLM veya geliştirici yeni bir göreve başlamadan önce terminalde `git pull` yaparak güncel depo durumunu çeker.
   - Model, işe başlamadan önce `.knowledge/sessions/mobile/` altındaki en son oturum dosyasını okuyarak projenin güncel durumunu kavrar.
