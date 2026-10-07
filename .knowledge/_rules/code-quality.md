# Kod Kalitesi ve Tasarım İlkeleri

1. **Kendi Kendini Açıklayan Kod:** Fonksiyon ve değişken isimleri açık olmalı; gereksiz inline yorumlardan kaçınılmalıdır.
2. **Hata Yönetimi (Error Handling):** Sessizce yutulan `try-catch` blokları yasaktır; tüm hatalar loglanmalı veya üst katmana fırlatılmalıdır.
3. **Tip Güvenliği:** Mümkün olan her yerde katı tip denetimi (strict typing / TypeScript / Type hints) uygulanmalıdır.