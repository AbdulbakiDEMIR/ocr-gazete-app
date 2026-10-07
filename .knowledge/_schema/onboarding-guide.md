# Proje İlk Kurulum ve Onboarding Protokolü

Bu repo bir **başlangıç şablonudur**. Yeni bir projede ilk kez çalıştırıldığında LLM bu akışı adım adım yürütür ve şablonu projeye uyarlar. Projeye göre doldurulacak her yer `{{...}}` veya `<!-- TODO(onboarding) -->` ile işaretlidir (bkz. [[_schema/conventions]]).

## Aşama 0: Hazırlık
1. `git checkout -b chore/onboarding` ile kurulum dalını aç (main'e doğrudan commit atılmaz, bkz. [[_rules/git-workflow]]).
2. `.knowledge/inbox/` içinde dosya varsa önce [[_schema/ingest-guide]] ile işle; sorulara cevap ararken bu bilgileri kullan.
3. Kalan işaretleri gör: `python scripts/vault-lint.py --strict` (bu aşamada hata vermesi normaldir; liste yapılacaklar listesidir).

## Aşama 1: Soru Sorma & Bilgi Toplama
Kullanıcıya şu soruları sırayla veya blok halinde sor (inbox'tan cevabı bulunanları sadece teyit ettir):
1. **Proje Tanımı:** Projenin adı, temel amacı ve çözeceği temel problem nedir?
2. **Platformlar:** Projede hangileri olacak? Web, Mobil, ikisi birden? Ayrı bir backend/API uygulaması var mı (örn: `apps/api/`), yoksa API web uygulamasının içinde mi?
3. **Teknoloji Yığını:** Seçilen her platform için framework, stil, state yönetimi; backend dili/framework'ü ve veritabanı nedir?
4. **Servisler ve Modüller:** İlk etapta tasarlanacak ana servisler (örn: Auth, Payment, User vb.) ve tablolar nelerdir?
5. **Dağıtım & Domain:** Sunucuya deploy edilecek mi? Hangi subdomain'de çalışacak (örn: `api.domain.com`), konteyner iç portu ve kalıcı volume ihtiyacı nedir? Varsayılan altyapı (GCP + Traefik + `/opt/core`) geçerli mi?

## Aşama 2: Şablonu Projeye Uyarlama
Yanıtlara göre dosyaları sırayla güncelle; her dosyadaki işaretleri gerçek değerlerle değiştir veya bloğu kaldır:
1. **`.knowledge/index.md`:** `{{PROJECT_NAME}}` alanını doldur (`init-vault` betiği çalıştıysa zaten doludur). Servisleri `## Çekirdek Servisler` altına `[[entities/...]]` olarak bağla.
2. **`.knowledge/architecture/overview.md`:** Amaç, platformlar, backend, veritabanı ve altyapıyı yaz.
3. **Platform dosyaları:** Seçilen her platform için `architecture/web.md` / `architecture/mobile.md` dosyasını doldur. Ayrı backend varsa `architecture/api.md` oluştur ve `apps/api/` dizinini aç.
4. **Seçilmeyen platformu temizle:** Örn. mobil yoksa şunları kaldır:
   - `apps/mobile/`, `architecture/mobile.md`, `sessions/mobile/`
   - `index.md`, `architecture/overview.md` ve `sessions/README.md` içindeki ilgili linkler
   - `AGENTS.md` Bölüm 8'deki ilgili madde ve `.obsidian/graph.json` gerekmiyorsa ilgili renk grubu
5. **`.knowledge/entities/<servis-adi>.md`:** Her modül için [[_schema/entity-template]] şablonuyla ayrı dosya oluştur.
6. **`.knowledge/contracts/api-endpoints.md`:** Base URL'i doldur, örnek Auth bloğunu gerçek endpoint'lerle değiştir veya sil. API yoksa dosyayı "henüz endpoint yok" olarak bırak.
7. **Dağıtım (deploy edilecekse):**
   - Repo köküne `docker-compose.yml` oluştur: `core_<servis>` konteyner adı, Traefik label'ları, harici `core_network`, isimlendirilmiş volume'ler; dışarı `ports:` açma (bkz. [[_rules/deployment-cicd]]).
   - `.env.example` oluştur (gerçek değer içermez).
   - Kullanıcıya GitHub ayarlarını hatırlat: Secrets (`HOST`, `USERNAME`, `SSH_KEY`, isteğe bağlı `PORT`) ve Variables (`DEPLOY_ENABLED=true`, isteğe bağlı `DEPLOY_PATH`). `DEPLOY_ENABLED` ayarlanmadan deploy iş akışı çalışmaz.
   - Deploy edilmeyecekse `.github/workflows/deploy.yml` dosyasını silmeyi öner.
8. **Kurallar:** Kullanıcının belirttiği proje özelindeki farkları (`_rules/code-quality.md` dil/linters, altyapı farkları) ilgili kural dosyasına işle.
9. **Kararlar:** Teknoloji seçimlerini `decisions/0001-<kisa-baslik>.md` olarak [[_schema/adr-template]] ile kaydet ve `decisions/README.md` listesine bağla.

## Aşama 3: Doğrulama ve İlk Commit
1. `python scripts/vault-lint.py --strict` temiz geçmeli (kırık link, kalan işaret veya yetim sayfa yok).
2. İlk oturum notunu `.knowledge/sessions/<YYYY-MM-DD>-onboarding.md` olarak yaz ve `sessions/README.md` listesine bağla.
3. `git status` ile değişiklikleri gözden geçir, ardından commit at:
   `git add -A`
   `git commit -m "chore(init): project onboarding completed and knowledge graph populated"`
4. Dalı push et ve main'e PR aç (veya kullanıcıya bırak).
5. Kullanıcıya grafın hazır olduğunu ve geliştirmeye başlanabileceğini bildir.
