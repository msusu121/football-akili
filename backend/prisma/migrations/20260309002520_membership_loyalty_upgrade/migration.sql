-- AlterTable
ALTER TABLE `membershipplan` MODIFY `tier` ENUM('BASIC', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `membership` ENUM('NONE', 'PENDING', 'ACTIVE', 'EXPIRED') NOT NULL DEFAULT 'NONE',
    MODIFY `membershipTier` ENUM('BASIC', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE `MembershipProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `jerseySize` VARCHAR(191) NULL,
    `nextOfKin` VARCHAR(191) NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MembershipProfile_userId_key`(`userId`),
    UNIQUE INDEX `MembershipProfile_qrToken_key`(`qrToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyWallet` (
    `userId` VARCHAR(191) NOT NULL,
    `balancePoints` INTEGER NOT NULL DEFAULT 0,
    `lifetimeEarned` INTEGER NOT NULL DEFAULT 0,
    `lifetimeRedeemed` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyEntry` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('MEMBERSHIP_SIGNUP', 'MERCH_PURCHASE', 'MATCH_CHECKIN', 'EVENT_ATTENDANCE', 'REFERRAL_BONUS', 'REDEMPTION', 'MANUAL_ADJUSTMENT') NOT NULL,
    `points` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoyaltyEntry_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyReward` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `pointsCost` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RewardRedemption` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rewardId` VARCHAR(191) NOT NULL,
    `pointsCost` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RewardRedemption_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MembershipProfile` ADD CONSTRAINT `MembershipProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoyaltyWallet` ADD CONSTRAINT `LoyaltyWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoyaltyEntry` ADD CONSTRAINT `LoyaltyEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RewardRedemption` ADD CONSTRAINT `RewardRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RewardRedemption` ADD CONSTRAINT `RewardRedemption_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `LoyaltyReward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
