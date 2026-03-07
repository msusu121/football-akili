-- CreateTable
CREATE TABLE `AdBanner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `placement` ENUM('HEADER_TOP', 'HEADER_BELOW_NAV', 'HOME_INLINE') NOT NULL DEFAULT 'HEADER_TOP',
    `href` LONGTEXT NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `mediaId` VARCHAR(191) NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdBanner_placement_isActive_sort_idx`(`placement`, `isActive`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdBanner` ADD CONSTRAINT `AdBanner_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
