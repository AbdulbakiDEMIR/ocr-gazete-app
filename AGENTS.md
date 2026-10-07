# Agent Geliştirme Talimatları

> Bu dosya tüm AI araçları için **tek kaynaktır**. `CLAUDE.md`, `GEMINI.md`, `.cursorrules` ve `.gemini/rules.md` yalnızca buraya yönlendirir; kural değişikliklerini sadece bu dosyada yap.

Sen bu projenin kıdemli yazılım mühendisisin. Token tasarrufu sağlamak, bütüncül sistem bağlamını korumak ve sunucu mimarisine tam uyum sağlamak için şu kurallara kesinlikle uy:

### 1. Hafıza ve Gezinme (Token Tasarrufu)
- İşe başlamadan önce mutlaka `.knowledge/index.md` dosyasını oku ve ilgili wikilinkleri (`[[...]]`) izleyerek hedefe ulaş.
- Kod tabanında hedefsiz, geniş çaplı aramalar (tüm repoyu grep/find ile taramak) yapma. Önce grafikten ilgili dizini/dosyayı bul, ardından yalnızca o alanda hedefli arama yap.

### 2. Kural Tetikleyicileri (Rule Triggers)
Hangi işlemi yapıyorsan, işlem öncesinde ilgili kural dosyasını oku:
- **Git ve Branch işlemleri:** `[[_rules/git-workflow]]` kurallarına (Conventional Commits, branch kuralları) eksiksiz uy.
- **Dağıtım ve Test Durumu:** Bu projede sunucu dağıtımı (deploy) yoktur; proje salt mobil uygulamadır. Mobil test ve altyapı standartları için `[[_rules/deployment-cicd]]` dosyasını incele.
- **Kod ve Tasarım:** `[[_rules/code-quality]]` standartlarına uy.

### 3. Dokümantasyon ve Graf Sorumluluğu
- Yeni bir servis, endpoint, tablo veya model eklediğinde `.knowledge/entities/` altına `[[_schema/entity-template]]` şablonuyla dokümanını oluştur ve üst bağlantılarını (`[[...]]`) bağla.
- Mimariyi değiştiren kararlarda `.knowledge/decisions/` altına `[[_schema/adr-template]]` formatında kayıt düş.

### 4. Bağlantı ve Çıkış Kontrolü
- Çalışmayı tamamlamadan önce terminalde `python scripts/vault-lint.py` çalıştırarak kırık link bırakmadığını doğrula (Python 3.8+ gerekir).
- Onboarding tamamlandıktan sonra `python scripts/vault-lint.py --strict` da temiz geçmelidir (doldurulmamış `{{...}}` / `TODO(onboarding)` ve yetim sayfa kalmamalı).

### 5. Proje Başlangıç Modu (Onboarding)
Kullanıcı "Projeyi kuralım", "Yeni proje başlat" veya benzeri bir başlangıç komutu verdiğinde:
- Doğrudan kod yazmaya başlama.
- `.knowledge/_schema/onboarding-guide.md` dosyasındaki adımları devreye al.
- Kullanıcıya gerekli kurulum sorularını sor, cevapları bekle.
- Yanıtlar doğrultusunda `.knowledge/` grafını ve konfigürasyonları doldur; şablondaki tüm `{{...}}` ve `TODO(onboarding)` işaretlerini kaldır.
- `python scripts/vault-lint.py --strict` temiz geçtikten sonra geliştirme aşamasına geç.

### 6. Oturum Hafızası ve Kapanış (Session Memory)
- Her geliştirme oturumunun veya büyük bir görevin sonunda yeni bir oturum dosyası aç:
  - Ad formatı: `<YYYY-MM-DD>-<kisa-konu>.md` (sıra numarası kullanma).
  - Konum: Mobil geliştirme için `.knowledge/sessions/mobile/`; genel işler (graf, CI) için `.knowledge/sessions/`.
  - Dosyayı ilgili `README.md` içindeki "Oturumlar" listesine wikilink olarak ekle.
- Bu dosyaya:
  1. Hangi özelliklerin eklendiğini/düzeltildiğini,
  2. Varsa alınan yeni kararları (`[[decisions/...]]`),
  3. Bir sonraki oturumda nereden devam edileceğini (Next Steps) madde madde yaz.
- Yeni bir oturuma başlarken `.knowledge/sessions/mobile/` altındaki en son oturum notunu oku.

### 7. Kaynak Bilgi İşleme (Ingest Modu)
Kullanıcı "Kaynakları tara", "Yeni dökümanları işle", "Bilgileri güncelle" veya "/ingest" dediğinde:
1. `.knowledge/_schema/ingest-guide.md` protokolünü uygula.
2. `.knowledge/inbox/` içindeki dosyaları incele, sistemin anlayacağı `.knowledge/entities/` veya `.knowledge/concepts/` Markdown formatına çevir ve `index.md` haritasına bağla.
3. İşlenen dosyayı `.knowledge/archive/` klasörüne taşı.
4. `python scripts/vault-lint.py` ile bağlantıları teyit et.

*Not: Proje ilk kurulurken (.knowledge/_schema/onboarding-guide.md çalışırken), eğer inbox içinde dosya varsa kurulum aşamasında bunları da otomatik olarak inceleyip sisteme dahil et.*

### 8. Platform Farkındalığı (Mobil Odaklı)
Bu projede web platformu bulunmamaktadır. Yalnızca mobil uygulama geliştirilecektir:
- **Mobil Geliştirmesi Yapılırken:** `apps/mobile/` dizinini baz al, `.knowledge/architecture/mobile.md` ve `.knowledge/contracts/` dosyalarını oku. Oturum özetini `.knowledge/sessions/mobile/` altına bırak.
- Bir endpoint veya veri tipi değiştiğinde `.knowledge/contracts/api-endpoints.md` dosyasını derhal senkronize et.
