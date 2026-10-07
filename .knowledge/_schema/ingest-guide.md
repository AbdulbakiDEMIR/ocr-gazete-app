# Bilgi Sindirme ve Kaynak Entegrasyon Protokolü (Ingest)

Kullanıcı "Kaynakları işle", "Yeni dökümanı tara", "/ingest" dediğinde veya ilk kurulumda bu akışı uygula:

## 1. Tarama ve Okuma
- `.knowledge/inbox/` klasöründeki tüm yeni dosyaları (PDF, MD, TXT vb.) tespit et.
- Dosya içeriğini analiz et: Hangi servisler, veri modelleri, kurallar veya iş mantıkları yer alıyor?

## 2. Graf Dönüşümü (Atomik Notlara Ayırma)
Ham dosyadaki bilgileri tek bir devasa dosya yapmak yerine şu şekilde böl:
- **Teknoloji/Kavramlar:** `.knowledge/concepts/<kavram-adi>.md` (örn: `concepts/jwt-auth.md`)
- **İş Mantığı ve Servisler:** `.knowledge/entities/<servis-adi>.md` (örn: `entities/order-module.md`), [[_schema/entity-template]] şablonuyla
- **Yeni Mimariler/Kararlar:** `.knowledge/architecture/` veya `.knowledge/decisions/` altına aktar.

## 3. Bağlantılandırma (Wikilinks)
- Oluşturulan her yeni `.md` dosyasının başına uzantısıyla birlikte `Kaynak: [[archive/<dosya-adi.uzanti>]]` bilgisini ekle (örn: `[[archive/api-spec.pdf]]`).
- `.knowledge/index.md` dosyasını aç ve yeni eklenen kavram/servisleri ilgili başlık altına `[[...]]` ile bağla.

## 4. Arşivleme ve Doğrulama
- İşlenen ham dosyayı `.knowledge/inbox/` içinden `.knowledge/archive/` dizinine taşı.
- Terminalde `python scripts/vault-lint.py` çalıştırarak kırık bağlantı kalmadığını doğrula.
- Kullanıcıya özet geç: "Hangi dosyalar işlendi, hangi yeni düğümler (.md) oluşturuldu?"