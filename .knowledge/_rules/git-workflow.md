# Git Protokolü ve Sürüm Kontrol Kuralları

1. **Commit Mesaj Standartları (Conventional Commits):**
   - `feat(scope): ...` -> Yeni bir özellik eklendiğinde.
   - `fix(scope): ...` -> Hata düzeltmelerinde.
   - `refactor(scope): ...` -> Davranış değiştirmeyen kod düzenlemelerinde.
   - `docs(vault): ...` -> .knowledge grafiğindeki güncellemelerde.
   - `test(scope): ...` -> Test ekleme/düzeltmelerinde.
   - `ci(scope): ...` -> GitHub Actions ve dağıtım betiklerinde.
   - `chore(scope): ...` -> Kurulum, bağımlılık ve bakım işlerinde (örn: `chore(init)`).

2. **Dal (Branch) Yönetimi:**
   - Asla doğrudan `main` / `master` dalına commit atılmaz; tüm değişiklikler bir dal üzerinden PR ile birleştirilir.
   - Yeni özellikler: `feat/<kisa-aciklama>`
   - Hata çözümleri: `fix/<hata-no-veya-aciklama>`
   - Kurulum ve bakım: `chore/<kisa-aciklama>` (örn: `chore/onboarding`)
   - Tek istisna: GitHub'ın "Use this template" ile oluşturduğu ilk commit.

3. **Bilgi Grafiği Senkronizasyonu:**
   - Yeni bir servis, API ucu veya model kodlandığında, commit atılmadan önce `.knowledge/entities/` altına dokümanı eklenmelidir.
   - Mimari bir değişiklik yapıldığında `.knowledge/decisions/` altına yeni bir ADR (Architecture Decision Record) kaydedilmelidir.
