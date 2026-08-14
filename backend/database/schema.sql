CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO roles (role_name) VALUES
('Admin'),
('Store Manager'),
('Retail Analyst'),
('Marketing Manager');
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL
);
CREATE TABLE shelves (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    shelf_id INTEGER NOT NULL,
    views INTEGER DEFAULT 0,
    pickups INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    attention_duration FLOAT DEFAULT 0,
    attractiveness_score FLOAT DEFAULT 0,
    FOREIGN KEY (shelf_id) REFERENCES shelves(id)
);