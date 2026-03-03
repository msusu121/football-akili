-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `group` VARCHAR(191) NULL,
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `variantId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `group` ENUM('ADULT', 'KIDS') NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `price` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'KES',
    `stock` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_group_idx`(`productId`, `group`),
    UNIQUE INDEX `ProductVariant_productId_group_size_key`(`productId`, `group`, `size`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
