# Genel Sistem ve Altyapı Mimarisi

<!-- TODO(onboarding): Aşağıdaki altyapı varsayılan standarttır; projeye göre teyit et veya güncelle, ardından bu satırı sil. -->

- **Proje Amacı:** {{PROJECT_PURPOSE}}
- **Platformlar:** {{PLATFORMS}} <!-- örn: Web + Mobil, yalnızca Web -->
- **Backend / API:** {{BACKEND_STACK}}
- **Veritabanı:** {{DATABASE}}
- **Bulut Sağlayıcı:** Google Cloud Platform (GCP Compute Engine VM)
- **Sunucu Giriş Noktası:** `/opt/core`
- **DNS & CDN:** Cloudflare (DNS Only / Proxy + Bypass rules)
- **Yönlendirme:** Traefik v2/v3 Reverse Proxy
- **İzleme & Log:** Dozzle, Portainer
- **CI/CD:** GitHub Actions -> SSH Deploy

## Katmanlar
- [[architecture/web|Web Mimarisi]]
- [[architecture/mobile|Mobil Mimarisi]]
- [[contracts/api-endpoints|API Sözleşmeleri]]

## İlgili Protokoller
- [[_rules/deployment-cicd|Dağıtım ve Altyapı Kuralları]]
- [[_rules/git-workflow|Git Protokolleri]]
