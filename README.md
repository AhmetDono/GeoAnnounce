# Geo Announce

**Language / Dil:** [English](#english) | [Türkçe](#türkçe)

---

## English

### Description
This project is a location-based announcement system where users can create announcements, mark them on a map, and view nearby announcements in real-time.

### Technologies

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Web Socket

### Features

- JWT-based user authentication
- Role-based access control (admin, user)
- Resource ownership control
- CRUD operations for bulletins, users, and reports
- Clean and modular code with middleware structure
- Proper HTTP responses for unauthorized access and error states

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the project root directory and define the following variables:
   ```ini
   JWT_SECRET=your_jwt_secret_key
   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### API Endpoints

#### Users

| Method | Endpoint         | Description                           | Middleware                                    |
|--------|------------------|---------------------------------------|-----------------------------------------------|
| POST   | `/user/register` | Register new user                     | -                                             |
| POST   | `/user/login`    | User login                            | -                                             |
| GET    | `/user/getall`   | List all users (Admin only)           | `verifyToken`, `isAdmin`                      |
| GET    | `/user/:id`      | Get specific user information         | `verifyToken`, `isAuthenticated`              |
| PUT    | `/user/:id`      | Update user (own profile)             | `verifyToken`, `isResourceOwner('User')`      |
| DELETE | `/user/:id`      | Delete user (own profile)             | `verifyToken`, `isResourceOwner('User')`      |

#### Bulletins

| Method | Endpoint                  | Description                            | Middleware                                       |
|--------|---------------------------|----------------------------------------|--------------------------------------------------|
| POST   | `/bulletin/create`        | Create new bulletin                    | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/nearby`        | Get nearby bulletins                   | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/userbulletins` | Get user's bulletins                   | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/getall`        | Get all bulletins (Admin only)        | `verifyToken`, `isAdmin`                         |
| GET    | `/bulletin/:id`           | Get specific bulletin                  | `verifyToken`, `isAuthenticated`                 |
| PUT    | `/bulletin/:id`           | Update bulletin (owner or admin)       | `verifyToken`, `isResourceOwner('Bulletin')`     |
| DELETE | `/bulletin/:id`           | Delete bulletin (owner or admin)       | `verifyToken`, `isResourceOwner('Bulletin')`     |

#### Reports

| Method | Endpoint         | Description                    | Middleware                       |
|--------|------------------|--------------------------------|----------------------------------|
| POST   | `/report/create` | Create new report              | `verifyToken`, `isAuthenticated` |
| GET    | `/report/getall` | List all reports (Admin only)  | `verifyToken`, `isAdmin`         |
| GET    | `/report/:id`    | Get specific report (Admin only) | `verifyToken`, `isAdmin`       |
| DELETE | `/report/:id`    | Delete report (Admin only)     | `verifyToken`, `isAdmin`         |

### Middleware Descriptions

- **`verifyToken`**: Validates JWT token in requests and adds authenticated user information to `req.user`.
- **`isAuthenticated`**: Checks if the user is authenticated.
- **`isAdmin`**: Checks if the user has `admin` role.
- **`isResourceOwner(model, paramName, ownerField)`**: Checks if the user is the owner of the specified resource or is an admin.

### Development

To run the project in development environment:

```bash
npm run dev
```

> **Note:** Automatic restart is provided if `nodemon` is installed.

### Contributing

We welcome your contributions! Fork the project, make your changes, and submit a pull request.

---

## Türkçe

### Açıklama
Bu proje, kullanıcıların duyurular oluşturup harita üzerinde işaretlediği ve yakınındaki duyuruları anlık olarak görebildiği bir projedir.

### Teknolojiler

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Web Socket

### Özellikler

- JWT ile kullanıcı doğrulama
- Rol tabanlı erişim kontrolü (admin, kullanıcı)
- Kaynak sahipliği (resource ownership) kontrolü
- Bülten, kullanıcı ve rapor yönetimi için CRUD işlemleri
- Middleware yapısı ile temiz ve modüler kod
- Yetkisiz erişim ve hata durumları için uygun HTTP cevapları

### Kurulum

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

### API Endpoints

#### Kullanıcılar (User)

| Metod  | Endpoint         | Açıklama                              | Middleware                                    |
|--------|------------------|---------------------------------------|-----------------------------------------------|
| POST   | `/user/register` | Yeni kullanıcı kaydı                  | -                                             |
| POST   | `/user/login`    | Kullanıcı girişi                      | -                                             |
| GET    | `/user/getall`   | Tüm kullanıcıları listele (Admin)     | `verifyToken`, `isAdmin`                      |
| GET    | `/user/:id`      | Belirli kullanıcı bilgisi             | `verifyToken`, `isAuthenticated`              |
| PUT    | `/user/:id`      | Kullanıcı güncelleme (kendi profili)  | `verifyToken`, `isResourceOwner('User')`      |
| DELETE | `/user/:id`      | Kullanıcı silme (kendi profili)       | `verifyToken`, `isResourceOwner('User')`      |

#### Bültenler (Bulletin)

| Metod  | Endpoint                  | Açıklama                                   | Middleware                                       |
|--------|---------------------------|--------------------------------------------|--------------------------------------------------|
| POST   | `/bulletin/create`        | Yeni bülten oluştur                        | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/nearby`        | Yakındaki bültenleri getir                 | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/userbulletins` | Kullanıcının bültenlerini getir            | `verifyToken`, `isAuthenticated`                 |
| GET    | `/bulletin/getall`        | Tüm bültenleri getir (Admin)               | `verifyToken`, `isAdmin`                         |
| GET    | `/bulletin/:id`           | Belirli bülteni getir                      | `verifyToken`, `isAuthenticated`                 |
| PUT    | `/bulletin/:id`           | Bülten güncelle (sahip veya admin)         | `verifyToken`, `isResourceOwner('Bulletin')`     |
| DELETE | `/bulletin/:id`           | Bülten sil (sahip veya admin)              | `verifyToken`, `isResourceOwner('Bulletin')`     |

#### Raporlar (Report)

| Metod  | Endpoint         | Açıklama                       | Middleware                       |
|--------|------------------|--------------------------------|----------------------------------|
| POST   | `/report/create` | Yeni rapor oluştur             | `verifyToken`, `isAuthenticated` |
| GET    | `/report/getall` | Tüm raporları listele (Admin)  | `verifyToken`, `isAdmin`         |
| GET    | `/report/:id`    | Belirli raporu getir (Admin)   | `verifyToken`, `isAdmin`         |
| DELETE | `/report/:id`    | Rapor sil (Admin)              | `verifyToken`, `isAdmin`         |

### Middleware Açıklamaları

- **`verifyToken`**: İsteklerdeki JWT tokenını doğrular, doğrulanmış kullanıcı bilgilerini `req.user`'a ekler.
- **`isAuthenticated`**: Kullanıcının doğrulanmış olduğunu kontrol eder.
- **`isAdmin`**: Kullanıcının `admin` rolüne sahip olup olmadığını kontrol eder.
- **`isResourceOwner(model, paramName, ownerField)`**: Belirtilen modeldeki kaynağın sahibi olup olmadığını veya admin olup olmadığını kontrol eder.

### Çalıştırma

Projeyi geliştirme ortamında çalıştırmak için:

```bash
npm run dev
```

> **Not:** `nodemon` kurulu ise otomatik yeniden başlatma sağlar.

### Katkıda Bulunma

Katkılarınızı bekliyoruz! Fork'layın, değişikliklerinizi yapın ve pull request gönderin.
