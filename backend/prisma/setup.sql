-- SmartGuide Database Setup
-- Run this in MySQL Workbench against the `smartguide` database

USE smartguide;

-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `artefacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unique_public_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `category_id` INTEGER NULL,
    `location_id` INTEGER NULL,
    `status` ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `artefacts_unique_public_id_key`(`unique_public_id`),
    INDEX `artefacts_unique_public_id_idx`(`unique_public_id`),
    INDEX `artefacts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `artefact_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artefact_id` INTEGER NOT NULL,
    `storage_path` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `artefact_images_artefact_id_display_order_idx`(`artefact_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `artefact_audio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artefact_id` INTEGER NOT NULL,
    `storage_path` VARCHAR(191) NOT NULL,
    `audio_url` VARCHAR(191) NOT NULL,
    `duration` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `artefact_audio_artefact_id_key`(`artefact_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `qr_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artefact_id` INTEGER NOT NULL,
    `unique_short_code` VARCHAR(191) NOT NULL,
    `public_url` VARCHAR(191) NOT NULL,
    `qr_image_path` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `qr_codes_artefact_id_key`(`artefact_id`),
    UNIQUE INDEX `qr_codes_unique_short_code_key`(`unique_short_code`),
    UNIQUE INDEX `qr_codes_public_url_key`(`public_url`),
    INDEX `qr_codes_unique_short_code_idx`(`unique_short_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `changes` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `artefacts` ADD CONSTRAINT `artefacts_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `artefacts` ADD CONSTRAINT `artefacts_location_id_fkey`
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `artefact_images` ADD CONSTRAINT `artefact_images_artefact_id_fkey`
    FOREIGN KEY (`artefact_id`) REFERENCES `artefacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `artefact_audio` ADD CONSTRAINT `artefact_audio_artefact_id_fkey`
    FOREIGN KEY (`artefact_id`) REFERENCES `artefacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_artefact_id_fkey`
    FOREIGN KEY (`artefact_id`) REFERENCES `artefacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create a fake _prisma_migrations entry so Prisma Client doesn't complain
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'Schema created successfully!' AS result;
