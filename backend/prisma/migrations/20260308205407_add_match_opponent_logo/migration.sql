-- AlterTable
ALTER TABLE `match` ADD COLUMN `opponentLogoId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_opponentLogoId_fkey` FOREIGN KEY (`opponentLogoId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
