# Geo Announce

## Acıklama gelecek

## Teknolojiler

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Web Socket

## Özellikler

- JWT ile kullanıcı doğrulama
- Rol tabanlı erişim kontrolü (admin, kullanıcı)
- Kaynak sahipliği (resource ownership) kontrolü
- Bülten, kullanıcı ve rapor yönetimi için CRUD işlemleri
- Middleware yapısı ile temiz ve modüler kod
- Yetkisiz erişim ve hata durumları için uygun HTTP cevapları

## Kurulum

1. **Depoyu klonla:**
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. **Bağımlılıkları yükle:**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarla:**
   
   Proje kök dizininde `.env` dosyası oluştur ve aşağıdaki değişkenleri tanımla:
   ```ini
   JWT_SECRET=your_jwt_secret_key
   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. **Sunucuyu başlat:**
   ```bash
   npm start
   ```

## API Endpoints

### Kullanıcılar (User)

| Metod  | Endpoint         | Açıklama                              | Middleware                                    |
|--------|------------------|---------------------------------------|-----------------------------------------------|
| POST   | `/user/register` | Yeni kullanıcı kaydı                  | -                                             |
| POST   | `/user/login`    | Kullanıcı girişi                      | -                                             |
| GET    | `/user/getall`   | Tüm kullanıcıları listele (Admin)     | `verifyToken`, `isAdmin`                      |
| GET    | `/user/:id`      | Belirli kullanıcı bilgisi             | `verifyToken`, `isAuthenticated`              |
| PUT    | `/user/:id`      | Kullanıcı güncelleme (kendi profili)  | `verifyToken`, `isResourceOwner('User')`      |
| DELETE | `/user/:id`      | Kullanıcı silme (kendi profili)       | `verifyToken`, `isResourceOwner('User')`      |

### Bültenler (Bulletin)

| Metod  | Endpoint                  | Açıklama                                   | Middleware                                       |
|--------|---------------------------|--------------------------------------------|--------------------------------------------------|
| POST   | `/bulletin/create`        | Yeni bülten oluştur                        | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/nearby`        | Yakındaki bültenleri getir                 | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/userbulletins` | Kullanıcının bültenlerini getir            | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/getall`        | Tüm bültenleri getir (Admin)               | `verifyToken`, `isAdmin`                         |
| GET    | `/bulletin/:id`           | Belirli bülteni getir                      | `verifyToken`, `isAuthenticated`                 |
| PUT    | `/bulletin/:id`           | Bülten güncelle (sahip veya admin)         | `verifyToken`, `isResourceOwner('Bulletin')`     |
| DELETE | `/bulletin/:id`           | Bülten sil (sahip veya admin)              | `verifyToken`, `isResourceOwner('Bulletin')`     |

### Raporlar (Report)

| Metod  | Endpoint         | Açıklama                       | Middleware                |
|--------|------------------|--------------------------------|---------------------------|
| POST   | `/report/create` | Yeni rapor oluştur             | `verifyToken`, `isAuthenticated` |
| GET    | `/report/getall` | Tüm raporları listele (Admin)  | `verifyToken`, `isAdmin`  |
| GET    | `/report/:id`    | Belirli raporu getir (Admin)   | `verifyToken`, `isAdmin`  |
| DELETE | `/report/:id`    | Rapor sil (Admin)              | `verifyToken`, `isAdmin`  |

## Middleware Açıklamaları

- **`verifyToken`**: İsteklerdeki JWT tokenını doğrular, doğrulanmış kullanıcı bilgilerini `req.user`'a ekler.
- **`isAuthenticated`**: Kullanıcının doğrulanmış olduğunu kontrol eder.
- **`isAdmin`**: Kullanıcının `admin` rolüne sahip olup olmadığını kontrol eder.
- **`isResourceOwner(model, paramName, ownerField)`**: Belirtilen modeldeki kaynağın sahibi olup olmadığını veya admin olup olmadığını kontrol eder.

## Çalıştırma

Projeyi geliştirme ortamında çalıştırmak için:

```bash
npm run dev
```

> **Not:** `nodemon` kurulu ise otomatik yeniden başlatma sağlar.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Fork'layın, değişikliklerinizi yapın ve pull request gönderin.
