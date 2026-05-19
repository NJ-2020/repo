-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS review_images CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS product_variant_options CASCADE;
DROP TABLE IF EXISTS product_variant_groups CASCADE;
DROP TABLE IF EXISTS product_specifications CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  estimated_delivery VARCHAR(255),
  description TEXT,
  number_of_sold VARCHAR(50) DEFAULT '0',
  rating NUMERIC(2,1) DEFAULT 0.0,
  category VARCHAR(50) DEFAULT 'regular',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Product variant groups (e.g. "Warna", "Ukuran")
CREATE TABLE product_variant_groups (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);

-- Product variant options (e.g. "Gold", "Silver")
CREATE TABLE product_variant_options (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES product_variant_groups(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  price_modifier INTEGER DEFAULT 0
);

-- Product specifications
CREATE TABLE product_specifications (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  value TEXT NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Review images
CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

-- Cart items
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected BOOLEAN DEFAULT TRUE,
  selected_variants JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Products 1-10: Paket Teko Stainless (category = regular)
INSERT INTO products (id, title, base_price, stock, estimated_delivery, description, number_of_sold, rating, category) VALUES
(1, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam. Terbuat dari bahan stainless steel 304 yang tahan karat dan aman untuk kesehatan. Cocok untuk oleh-oleh haji dan umroh. Desain elegan dengan finishing gold yang mewah, cocok untuk hadiah dan cenderamata.', '10RB+', 4.7, 'regular'),
(2, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam. Terbuat dari bahan stainless steel 304 yang tahan karat dan aman untuk kesehatan.', '10RB+', 4.7, 'regular'),
(3, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(4, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(5, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(6, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(7, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(8, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(9, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular'),
(10, 'PAKET TEKO STAINLESS CUCING NAMPAN PAKET TEKO NAMPAN GOLD GELAS AIR ZAM ZAM SOUVENIR OLEH OLEH HAJI', 98500, 150, '3-5 hari kerja', 'Paket lengkap teko stainless berkualitas tinggi dengan namplan dan gelas air zam-zam.', '10RB+', 4.7, 'regular');

-- Products 11-20: Kantong Kerikil (category = hajj)
INSERT INTO products (id, title, base_price, stock, estimated_delivery, description, number_of_sold, rating, category) VALUES
(11, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh. Terbuat dari kain katun berkualitas yang lembut dan nyaman dibawa. Digunakan untuk menyimpan batu kerikil saat melontar jumrah. Praktis dan ringan.', '3RB+', 4.8, 'hajj'),
(12, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(13, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(14, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(15, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(16, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(17, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(18, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(19, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj'),
(20, 'KANTONG KERIKIL PERLENGKAPAN HAJI UMRAH KANTONG BATU IHRAM HAJI UMRAH PERLENGKAPAN IHRAM KANTONG KAIN KERIKIL IHRAM', 8330, 300, '2-4 hari kerja', 'Kantong kerikil untuk perlengkapan ibadah haji dan umroh.', '3RB+', 4.8, 'hajj');

-- Reset sequence
SELECT setval('products_id_seq', 20, true);

-- Product images for products 1-10
INSERT INTO product_images (product_id, image_url, sort_order) SELECT p.id, '/uploads/products/cangkir.jpeg', n FROM products p CROSS JOIN generate_series(0,3) n WHERE p.id BETWEEN 1 AND 10;

-- Product images for products 11-20
INSERT INTO product_images (product_id, image_url, sort_order) SELECT p.id, '/uploads/products/kaos-haji.webp', n FROM products p CROSS JOIN generate_series(0,2) n WHERE p.id BETWEEN 11 AND 20;

-- Variant groups for products 1-10: Warna + Ukuran
INSERT INTO product_variant_groups (product_id, name)
SELECT p.id, v.name
FROM products p
CROSS JOIN (VALUES ('Warna'), ('Ukuran')) AS v(name)
WHERE p.id BETWEEN 1 AND 10;

-- Variant options for Warna (group_id will vary per product)
-- We need to insert per product since group IDs are auto-generated
-- First, let us do it procedurally with a CTE approach

-- Warna options for products 1-10
INSERT INTO product_variant_options (group_id, label, price_modifier)
SELECT pvg.id, opts.label, opts.price_modifier
FROM product_variant_groups pvg
JOIN products p ON p.id = pvg.product_id
CROSS JOIN (VALUES ('Gold', 0), ('Silver', 0), ('Rose Gold', 0)) AS opts(label, price_modifier)
WHERE pvg.name = 'Warna' AND p.id BETWEEN 1 AND 10;

-- Ukuran options for products 1-10
INSERT INTO product_variant_options (group_id, label, price_modifier)
SELECT pvg.id, opts.label, opts.price_modifier
FROM product_variant_groups pvg
JOIN products p ON p.id = pvg.product_id
CROSS JOIN (VALUES ('S', 0), ('M', 5000), ('L', 10000)) AS opts(label, price_modifier)
WHERE pvg.name = 'Ukuran' AND p.id BETWEEN 1 AND 10;

-- Variant groups for products 11-20: Warna only
INSERT INTO product_variant_groups (product_id, name)
SELECT p.id, 'Warna'
FROM products p
WHERE p.id BETWEEN 11 AND 20;

-- Warna options for products 11-20
INSERT INTO product_variant_options (group_id, label, price_modifier)
SELECT pvg.id, opts.label, opts.price_modifier
FROM product_variant_groups pvg
JOIN products p ON p.id = pvg.product_id
CROSS JOIN (VALUES ('Putih', 0), ('Hitam', 0), ('Hijau', 500)) AS opts(label, price_modifier)
WHERE pvg.name = 'Warna' AND p.id BETWEEN 11 AND 20;

-- Specifications for products 1-10
INSERT INTO product_specifications (product_id, label, value)
SELECT p.id, s.label, s.value
FROM products p
CROSS JOIN (VALUES
  ('Brand', 'Taqarrub Market'),
  ('Berat', '500g'),
  ('Bahan', 'Stainless Steel 304'),
  ('Dimensi', '15 x 10 x 8 cm'),
  ('Warna', 'Gold, Silver, Rose Gold'),
  ('Garansi', '6 bulan')
) AS s(label, value)
WHERE p.id BETWEEN 1 AND 10;

-- Specifications for products 11-20
INSERT INTO product_specifications (product_id, label, value)
SELECT p.id, s.label, s.value
FROM products p
CROSS JOIN (VALUES
  ('Brand', 'Taqarrub Market'),
  ('Berat', '50g'),
  ('Bahan', 'Kain Katun'),
  ('Dimensi', '10 x 8 cm'),
  ('Warna', 'Putih, Hitam, Hijau'),
  ('Garansi', '3 bulan')
) AS s(label, value)
WHERE p.id BETWEEN 11 AND 20;

-- Create a demo user for reviews (password: demo123)
INSERT INTO users (id, name, email, password_hash) VALUES
(1, 'Siti Aminah', 'siti@example.com', '$2b$10$dummyhashforsitiaminah');
INSERT INTO users (id, name, email, password_hash) VALUES
(2, 'Ahmad Rizky', 'ahmad@example.com', '$2b$10$dummyhashforahmadrizky');
INSERT INTO users (id, name, email, password_hash) VALUES
(3, 'Fatimah Zahra', 'fatimah@example.com', '$2b$10$dummyhashforfatimahzahra');
INSERT INTO users (id, name, email, password_hash) VALUES
(4, 'Muhammad Hasan', 'hasan@example.com', '$2b$10$dummyhashformuhammadhasan');
INSERT INTO users (id, name, email, password_hash) VALUES
(5, 'Nur Halimah', 'nur@example.com', '$2b$10$dummyhashfornurhalimah');
INSERT INTO users (id, name, email, password_hash) VALUES
(6, 'Abdul Rahman', 'abdul@example.com', '$2b$10$dummyhashforabdulrahman');
INSERT INTO users (id, name, email, password_hash) VALUES
(7, 'Omar Fadil', 'omar@example.com', '$2b$10$dummyhashforomarfadil');
INSERT INTO users (id, name, email, password_hash) VALUES
(8, 'Khadijah Sari', 'khadijah@example.com', '$2b$10$dummyhashforkhadijahsari');
INSERT INTO users (id, name, email, password_hash) VALUES
(9, 'Aisyah Dewi', 'aisyah@example.com', '$2b$10$dummyhashforaisyahdewi');

SELECT setval('users_id_seq', 9, true);

-- Reviews for product 1 (and other products can share)
INSERT INTO reviews (id, product_id, user_id, rating, text, created_at) VALUES
(1, 1, 1, 5, 'Alhamdulillah, produknya bagus banget! Teko-nya kokoh dan finishing-nya rapi. Cocok banget buat oleh-oleh haji. Keluarga di rumah suka semua.', '2025-12-15'),
(2, 1, 2, 5, 'Sudah beberapa kali beli di sini. Kualitas selalu konsisten dan pengiriman cepat. Recommended banget!', '2025-12-10'),
(3, 1, 3, 4, 'Paket tekko dan gelas zam-zam nya bagus, cocok buat oleh-oleh. Harganya juga lebih murah dibanding toko lain. Cuma packagingnya bisa ditingkatkan lagi.', '2025-11-28'),
(4, 1, 4, 5, 'Pelayanannya ramah dan responsif. Produk yang dikirim sesuai dengan foto. Pasti akan beli lagi untuk persiapan haji tahun depan.', '2025-11-20'),
(5, 1, 5, 5, 'Bahannya berkualitas dan harganya bersaing. Gelas zam-zam nya juga bagus. Jazakallahu khairan Taqarrub Market!', '2025-11-15'),
(6, 1, 6, 4, 'Belanja online untuk perlengkapan umroh jadi gampang di sini. Varian produknya banyak dan semua terjangkau. Packingnya juga rapi dan aman.', '2025-11-10'),
(7, 1, 7, 5, 'Mantap! Sudah 3 kali order dan selalu puas. Teko stainless-nya awet dan tidak berkarat. Bintang 5 deh!', '2025-10-30'),
(8, 1, 8, 4, 'Produk sesuai deskripsi. Harga terjangkau untuk kualitas seperti ini. Akan recommend ke teman-teman.', '2025-10-25'),
(9, 1, 9, 5, 'Suka banget! Desainnya elegan dan berkesan mewah. Bukan cuma buat oleh-oleh, buat dipakai sendiri juga cocok.', '2025-10-15');

SELECT setval('reviews_id_seq', 9, true);

-- Review images (some reviews have media)
INSERT INTO review_images (review_id, image_url) VALUES
(1, '/uploads/products/cangkir.jpeg'),
(1, '/uploads/products/cangkir.jpeg'),
(3, '/uploads/products/cangkir.jpeg'),
(5, '/uploads/products/cangkir.jpeg'),
(5, '/uploads/products/cangkir.jpeg'),
(5, '/uploads/products/cangkir.jpeg'),
(7, '/uploads/products/cangkir.jpeg'),
(9, '/uploads/products/cangkir.jpeg'),
(9, '/uploads/products/cangkir.jpeg');
