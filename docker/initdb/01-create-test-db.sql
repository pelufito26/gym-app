-- Base separada para tests de integración: nunca correr tests contra gym_dev.
-- Postgres ejecuta este archivo solo al crear el volumen por primera vez.
CREATE DATABASE gym_test OWNER gym;
