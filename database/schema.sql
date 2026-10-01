CREATE DATABASE IF NOT EXISTS mente_inabalavel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mente_inabalavel;

CREATE TABLE IF NOT EXISTS interest_registrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_interest_registrations_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
