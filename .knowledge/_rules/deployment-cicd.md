# Sunucu Altyapısı ve CI/CD Dağıtım Protokolleri

Bu projede geliştirilen servisler merkezi sunucu altyapısına (GCP VM + Traefik) entegre edilir.

## 1. Sunucu Mimarisi & Ağ Kuralları
- **Ters Proxy (Reverse Proxy):** Tüm dış trafik Traefik üzerinden 80/443 portlarıyla karşılanır. Yeni bir servis eklendiğinde doğrudan dışarı port açılmaz (`ports: - "3000:3000"` yasaktır). Bunun yerine Traefik etiketleri (labels) ve harici Docker ağı (`core_network` / bridge) kullanılır.
- **SSL / TLS:** Let's Encrypt HTTP-01 challenge kullanılır. Cloudflare SSL modu mutlaka **Full** veya **Full (Strict)** olmalıdır (Flexible seçilemez, yönlendirme döngüsüne girer).
- **Subdomain Standartları:** Yeni servisler `BASE_DOMAIN` altındaki subdomain'lerle yönlendirilir.

## 2. Docker & Compose Standartları
- Kalıcı veriler her zaman isimlendirilmiş volume'lerde saklanmalıdır (örn: `dozzle_data:/data`).
- Konteyner isimleri çakışmaması için `core_<servis_adi>` formatında olmalıdır.
- Ortam değişkenleri `.env.example` içerisinde güncellenmeli, gerçek gizli anahtarlar asla Git'e commit edilmemelidir.

## 3. GitHub Actions CI/CD Protokolü
- **Etkinleştirme:** Deploy iş akışı şablonda varsayılan olarak **kapalıdır**. Repo ayarlarında `DEPLOY_ENABLED=true` değişkeni (Variable) tanımlanana kadar çalışmaz. Repo kökünde `docker-compose.yml` yoksa iş akışı hata vererek durur.
- **Tetikleyici:** Yalnızca `main` branch'ine yapılan push veya merge işlemleri (ya da manuel `workflow_dispatch`) sunucuya deploy edilir.
- **Deploy Yolu:** Varsayılan `/opt/core`; farklı bir dizin için `DEPLOY_PATH` değişkeni tanımlanır.
- **Gereken GitHub Secrets:**
  - `HOST`: Sunucu IP
  - `USERNAME`: SSH kullanıcısı
  - `SSH_KEY`: Sunucu özel anahtarı
  - `PORT`: (isteğe bağlı) SSH portu, varsayılan 22
- **Gereken GitHub Variables:**
  - `DEPLOY_ENABLED`: `true`
  - `DEPLOY_PATH`: (isteğe bağlı) Sunucudaki proje dizini
- **İş Akışı:**
  1. `docker-compose.yml` varlığı doğrulanır.
  2. Sunucuya SSH ile bağlanılır ve deploy dizinine gidilir.
  3. `git pull --ff-only origin main` çekilir.
  4. `docker compose up -d --remove-orphans` ile kesintisiz yayına alınır.
