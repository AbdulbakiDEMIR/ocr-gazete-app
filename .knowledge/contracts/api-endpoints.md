# Ortak API ve Veri Sözleşmeleri (Contracts)

Bu dosya API'yi sağlayan taraf ile onu tüketen istemciler (Web / Mobil) arasındaki veri köprüsüdür. Yeni bir endpoint yazıldığında veya değiştiğinde burası güncellenir; istemci tarafındaki LLM istekleri buradaki tiplere göre kurgular.

- **Üst Mimari:** [[architecture/overview]]

## 1. Genel Kurallar
- **Base URL:** `{{API_BASE_URL}}` <!-- örn: https://api.domain.com/api/v1 -->
- **Tüm İsteklerde Başlık (Headers):**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>` <!-- TODO(onboarding): Kimlik doğrulama yöntemini teyit et. -->

---

## 2. Endpoint Listesi

<!-- TODO(onboarding): Aşağıdaki blok yalnızca FORMAT ÖRNEĞİDİR, gerçek bir sözleşme değildir. Projenin gerçek endpoint'leriyle değiştir. -->

### Örnek: Kimlik Doğrulama (Auth)
- **POST `/auth/login`**
  - **İstek (Payload):**
    ```json
    { "email": "string", "password": "string" }
    ```
  - **Yanıt (Response - 200 OK):**
    ```json
    { "token": "string", "user": { "id": "string", "email": "string", "name": "string" } }
    ```
