# Çoklu Geliştirici ve Platform Eşzamanlama Protokolü

1. **Sözleşme Önceliği (Contract-First):**
   - API tarafında yeni bir endpoint/parametre eklendiğinde veya değiştiğinde doğrudan `.knowledge/contracts/api-endpoints.md` güncellenmelidir.
   - İstemci (Web / Mobil) tarafındaki LLM, endpoint çağrılarını doğrudan `contracts/api-endpoints.md` dosyasına bakarak üretmelidir.

2. **Oturum Notlarının Ayrılması:**
   - Web oturum özetleri: `.knowledge/sessions/web/`
   - Mobil oturum özetleri: `.knowledge/sessions/mobile/`
   - Platformdan bağımsız işler: `.knowledge/sessions/`
   - Her oturum dosyası `<YYYY-MM-DD>-<kisa-konu>.md` şeklinde adlandırılır (sıra numarası kullanılmaz). Bu sayede paralel çalışan geliştiriciler arasında dosya adı çakışması oluşmaz.

3. **İşe Başlama Protokolü (Pull-Before-Work):**
   - LLM ile yeni bir göreve başlamadan önce terminalde `git pull` yapılarak diğer tarafın güncel hafızası çekilmelidir.
   - Model, işe başlamadan önce hem kendi alanının hem de diğer platformun en son (tarihe göre) oturum dosyasını okuyarak sistemin güncel durumunu kavramalıdır.
