-- V6__fix_admin_hash.sql
-- Fix the default development admin user password hash

UPDATE platform_admin
SET password_hash = '$2a$10$wBK56cp3AnpQAW9l22aCJushprNgOr88eQS8jkQWV15BirADEN6uS'
WHERE id = 'admin_dev_1';
