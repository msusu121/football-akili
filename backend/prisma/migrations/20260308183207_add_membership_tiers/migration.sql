/*
  Warnings:

  - A unique constraint covering the columns `[memberNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `memberNumber` VARCHAR(191) NULL,
    ADD COLUMN `memberSince` DATETIME(3) NULL,
    ADD COLUMN `membershipTier` ENUM('BASIC', 'BRONZE', 'SILVER', 'GOLD') NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE `MembershipPlan` (
    `id` VARCHAR(191) NOT NULL,
    `tier` ENUM('BASIC', 'BRONZE', 'SILVER', 'GOLD') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'KES',
    `durationDays` INTEGER NOT NULL DEFAULT 365,
    `description` LONGTEXT NULL,
    `benefits` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MembershipPlan_tier_key`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_memberNumber_key` ON `User`(`memberNumber`);
