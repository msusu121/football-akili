-- CreateTable
CREATE TABLE `LeagueTableSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `season` VARCHAR(191) NOT NULL,
    `competition` VARCHAR(191) NOT NULL,
    `asOfDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeagueTableSnapshot_season_competition_asOfDate_idx`(`season`, `competition`, `asOfDate`),
    UNIQUE INDEX `LeagueTableSnapshot_season_competition_asOfDate_key`(`season`, `competition`, `asOfDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeagueTableRow` (
    `id` VARCHAR(191) NOT NULL,
    `snapshotId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `teamName` VARCHAR(191) NOT NULL,
    `played` INTEGER NOT NULL,
    `won` INTEGER NOT NULL,
    `drawn` INTEGER NOT NULL,
    `lost` INTEGER NOT NULL,
    `goalsFor` INTEGER NOT NULL,
    `goalsAgainst` INTEGER NOT NULL,
    `goalDifference` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `logoUrl` VARCHAR(191) NULL,

    INDEX `LeagueTableRow_snapshotId_idx`(`snapshotId`),
    UNIQUE INDEX `LeagueTableRow_snapshotId_position_key`(`snapshotId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeagueTableRow` ADD CONSTRAINT `LeagueTableRow_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `LeagueTableSnapshot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
