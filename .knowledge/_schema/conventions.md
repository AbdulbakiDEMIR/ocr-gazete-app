# Kasa Yazım Kuralları

1. **Dosya İsimlendirme:** Tüm dosya isimleri `kebab-case` formatında olmalıdır (örn: `auth-service.md`). Oturum notları `<YYYY-MM-DD>-<kisa-konu>.md` formatındadır.
2. **Bağlantı Formatı:** Wikilink kullanımı zorunludur: `[[dizin/dosya-adi|Görünen İsim]]`. Başlığa bağlantı (`[[dosya#Başlık]]`) ve Markdown olmayan dosyalar (`[[archive/spec.pdf]]`) desteklenir.
3. **Graf Bütünlüğü:** Her yeni sayfa en az bir üst sayfaya (örneğin `[[index]]`, ilgili mimari veya ilgili README) bağlı olmalı ve en az bir sayfadan bağlantı almalıdır (yetim sayfa olmamalı).
4. **Placeholder İşaretleri:** Şablonda projeye göre doldurulacak yerler iki biçimde işaretlenir:
   - Değerler: `{{BUYUK_HARF_ADI}}` (örn: `{{PROJECT_NAME}}`)
   - Bloklar: `<!-- TODO(onboarding): ... -->`
   Onboarding sonunda `_schema/` dışında hiçbir işaret kalmamalıdır; `python scripts/vault-lint.py --strict` bunu denetler. `_schema/` altındaki şablonlar işaretlerini korur.
