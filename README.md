# 🧠 LLM Knowledge & Monorepo Template

Bu şablon; **Claude Code**, **Antigravity**, **Cursor** ve diğer LLM tabanlı kodlama asistanlarının tüm projeyi baştan sona tarayıp token tüketmesini ve bağlamını (context) kaybetmesini önlemek için tasarlanmıştır.

Tüm sistem mimarisini, kodlama kurallarını, veri sözleşmelerini ve oturum geçmişini iki yönlü bağlantılı (`[[...]]`) bir **bilgi grafiğinde (Knowledge Graph)** tutar. Web ve Mobil geliştiricilerinin (veya yapay zeka oturumlarının) aynı monorepo üzerinde çakışmadan, sözleşme öncelikli (contract-first) çalışmasını sağlar.

---

## 🤖 Desteklenen AI Araçları & Entegrasyon

Tüm kurallar **tek kaynakta** tutulur: [`AGENTS.md`](AGENTS.md). Diğer araçların kural dosyaları yalnızca buraya yönlendirir; kural değiştirirken sadece `AGENTS.md` dosyasını düzenleyin.

| Araç | Kural Dosyası | Açıklama |
| :--- | :--- | :--- |
| **Genel Ajanlar** | [`AGENTS.md`](AGENTS.md) | **Tek kaynak.** Cursor ve birçok ajan bu dosyayı doğrudan okur. |
| **Claude Code** | [`CLAUDE.md`](CLAUDE.md) | `@AGENTS.md` import'u ile kuralları otomatik yükler. |
| **Google Antigravity / Gemini CLI** | [`GEMINI.md`](GEMINI.md) | `@./AGENTS.md` import'u ile kuralları yükler. |
| **Cursor IDE (eski sürümler)** | [`.cursorrules`](.cursorrules) | `AGENTS.md` dosyasına yönlendirir. |

---

## ✅ Gereksinimler

- **Python 3.8+**: `scripts/vault-lint.py` için gereklidir (Windows'ta `python` komutu Microsoft Store kısayoluna değil gerçek kuruluma gitmelidir).
- **Windows PowerShell:** Betik çalıştırma kapalıysa `powershell -ExecutionPolicy Bypass -File .\init-vault.ps1` kullanın.

---

## 🏗️ Dizin Yapısı

```text
├── apps/
│   ├── web/                    # Web uygulaması kaynak kodları
│   └── mobile/                 # Mobil uygulama kaynak kodları
├── .knowledge/                 # Obsidian Uyumlu Bilgi Grafiği
│   ├── index.md                # Grafın merkezi haritası (ana giriş kapısı)
│   ├── architecture/           # Sistem mimarisi (genel, web, mobil)
│   ├── entities/               # Modeller, veri tabloları ve servisler
│   ├── contracts/              # Ortak API ve veri sözleşmeleri (DTO/Endpoints)
│   ├── decisions/              # Mimari Karar Kayıtları (ADR)
│   ├── sessions/               # Oturum özetleri (genel, web/ ve mobile/)
│   ├── inbox/                  # Ham dokümanların (PDF, MD vb.) bırakılacağı alan
│   ├── archive/                # İşlenmiş ham dokümanların taşınacağı arşiv
│   ├── _schema/                # Onboarding/ingest protokolleri, entity ve ADR şablonları
│   └── _rules/                 # Değişmez kurallar (Git, CI/CD, Kod kalitesi)
├── AGENTS.md                   # Tüm AI araçları için TEK kural kaynağı
├── CLAUDE.md                   # → AGENTS.md (Claude Code)
├── GEMINI.md                   # → AGENTS.md (Antigravity & Gemini)
├── .cursorrules                # → AGENTS.md (Cursor)
├── .github/workflows/deploy.yml # SSH deploy (varsayılan kapalı, bkz. Dağıtım)
├── scripts/
│   └── vault-lint.py           # Kırık link, yetim sayfa ve placeholder denetleyicisi
├── init-vault.sh               # Proje adını grafiğe işleyen başlatma betiği (Linux/macOS)
└── init-vault.ps1              # Proje adını grafiğe işleyen başlatma betiği (Windows)
```

---

## 🚀 Yeni Bir Proje Başlatma Adımları

### 1. Şablondan Yeni Repo Oluşturma
1. GitHub üzerinden bu depoyu açıp **"Use this template"** > **"Create a new repository"** seçeneğiyle yeni projenizi oluşturun.
2. Depoyu bilgisayarınıza klonlayın:
```bash
git clone https://github.com/<kullanici-adi>/<yeni-proje-adi>.git
cd <yeni-proje-adi>
```

### 2. Proje İsimlendirmesi
İşletim sisteminize uygun betiği çalıştırarak proje adını `.knowledge/index.md` dosyasına otomatik işletin:

```bash
# Linux / macOS / Git Bash
./init-vault.sh "Proje Adı"

# Windows (PowerShell)
.\init-vault.ps1 -ProjectName "Proje Adı"
```

### 3. Onboarding (Şablonu Projeye Uyarlama)
Bu repo bir **başlangıç taslağıdır**; projeye göre değişecek her yer `{{...}}` veya `<!-- TODO(onboarding) -->` ile işaretlidir. AI asistanınıza *"Projeyi kuralım"* deyin. Model `chore/onboarding` dalında:
- Platformları (Web / Mobil / ayrı API), teknoloji yığınını, servisleri ve dağıtım bilgilerini sorar,
- İşaretli tüm yerleri doldurur, seçilmeyen platformun dosyalarını kaldırır, örnek sözleşmeyi gerçek endpoint'lerle değiştirir,
- `python scripts/vault-lint.py --strict` temiz geçene kadar devam eder ve PR'a hazır commit'i oluşturur.

### 4. Dağıtımı Etkinleştirme (İsteğe Bağlı)
`deploy.yml` iş akışı şablonda **kapalıdır**; aksi halde yeni projede her push başarısız olurdu. Repoda `docker-compose.yml` oluştuktan sonra GitHub → Settings → Secrets and variables → Actions altında:
- **Secrets:** `HOST`, `USERNAME`, `SSH_KEY`, (isteğe bağlı) `PORT`
- **Variables:** `DEPLOY_ENABLED=true`, (isteğe bağlı) `DEPLOY_PATH` (varsayılan `/opt/core`)

Deploy edilmeyecek projelerde `.github/workflows/deploy.yml` silinebilir.

---

## 💬 LLM ile Çalışma & Örnek Talimatlar (Prompt Kılavuzu)

AI kodlama asistanınızla çalışırken fazladan dosya etiketlemenize (`@` kullanmanıza) gerek yoktur. Model kural dosyalarındaki direktifler sayesinde ne yapacağını bilir. İşte sık kullanılan talimat örnekleri:

### 1. Projeyi Sıfırdan Kurarken (Onboarding)
> *"Projeyi kuralım, gerekli soruları sorarak onboarding'i başlat."*  
> *(Eğer inbox'a önceden şartname koyduysanız: "Inbox'taki dokümanları da inceleyerek kurulumu başlat.")*
* **Model ne yapar?** `_schema/onboarding-guide.md` protokolünü işletir. Size proje amacını, teknoloji yığınını ve servisleri sorar; yanıtlarınıza göre `.knowledge/` altındaki mimari ve servis dosyalarını otomatik doldurur.

### 2. Kaldığınız Yerden Devam Ederken (Oturum Açılışı)
> *"Kaldığımız yerden devam edelim, son oturum notunu kontrol et."*
* **Model ne yapar?** Doğrudan `.knowledge/sessions/` altındaki son oturum dosyasını okur. Bir önceki oturumda nelerin tamamlandığını ve sıradaki adımları anlayarak size özet geçer.

### 3. Yeni Özellik / Servis Geliştirirken
* **Web Geliştirmesi:**
  > *"Web uygulamasında auth servisini kodlayalım, sözleşmeleri ve kod kurallarını baz al."*
* **Mobil Geliştirmesi:**
  > *"Mobil uygulamaya login ekranını ekleyelim, contracts/api-endpoints.md sözleşmesine göre yaz."*
* **Model ne yapar?** Tüm kod tabanını aramak yerine doğrudan `architecture/`, `contracts/` ve ilgili kural dosyalarını okuyarak hedefe odaklanır.

### 4. Dış Kaynak / Doküman Eklerken (Ingest Modu)
Yeni bir PDF, TXT veya API dökümanı geldiğinde dosyayı `.knowledge/inbox/` içine atın ve modele şu komutu verin:
> *"Inbox'a yeni döküman ekledim, inceleyip grafı güncelle."*
* **Model ne yapar?** `_schema/ingest-guide.md` protokolünü uygular. Dökümandaki bilgileri atomik `entities/` veya `concepts/` notlarına dönüştürür, `index.md`'ye bağlar ve ham dosyayı `archive/` klasörüne taşır.

### 5. Oturumu Kapatırken (Hafızayı Kaydetme)
> *"Bu oturumu tamamladık, oturum özetini yaz ve grafı doğrula."*
* **Model ne yapar?** `sessions/web/`, `sessions/mobile/` veya (platformdan bağımsız işler için) `sessions/` altına `<YYYY-MM-DD>-<konu>.md` formatında yapılan işleri, alınan kararları ve sıradaki adımları kaydeder. Ardından `python scripts/vault-lint.py` çalıştırarak kırık link bırakmadığını doğrular.

---

## 👥 Web & Mobil Ortak Çalışma Kuralları

İki geliştirici (biri Web, diğeri Mobil) çalışırken Git çakışmalarını ve bilgi kopukluğunu önlemek için:

1. **İşe Başlarken (Önce Güncel Kodu Çekin):**
   ```bash
   git pull origin main
   ```
   Her oturum başında LLM, `.knowledge/sessions/` altındaki son notları okuyarak diğer platformda ne yapıldığını öğrenir.

2. **Sözleşme Odaklı Çalışma (Contract-First):**
   * Web tarafında bir endpoint/parametre eklendiğinde doğrudan `.knowledge/contracts/api-endpoints.md` güncellenir.
   * Mobil geliştirmede LLM, mock veya gerçek istek kodlarını bu dosyadaki tiplere göre yazar.

3. **Ayrılmış Oturum Notları:**
   * Web tarafındaki çalışmalar: `.knowledge/sessions/web/<YYYY-MM-DD>-<konu>.md`
   * Mobil tarafındaki çalışmalar: `.knowledge/sessions/mobile/<YYYY-MM-DD>-<konu>.md`

---

## 🛠️ Pratik Komutlar

* **Grafik Sağlamlık Testi (Linting):**
  Yeni bir dosya veya link eklendiğinde kopuk link kalmadığını doğrulamak için:
  ```bash
  python scripts/vault-lint.py           # kırık link = hata; placeholder ve yetim sayfa = uyarı
  python scripts/vault-lint.py --strict  # onboarding sonrası: uyarılar da hata sayılır
  ```
  `[[dosya#Başlık]]`, `[[archive/spec.pdf]]` gibi Markdown olmayan hedefler desteklenir; kod blokları ve HTML yorumları içindeki linkler yok sayılır.

* **Obsidian'da Görselleştirme:**
  Bilgi grafiğini canlı ve renkli görmek için Obsidian uygulamasında **"Open folder as vault"** seçeneğiyle doğrudan `.knowledge/` klasörünü açabilirsiniz. Önceden yapılandırılmış `.obsidian/graph.json` ayarları sayesinde kurallar, mimari, sözleşmeler ve oturumlar farklı renklerde filtrelenecektir.
