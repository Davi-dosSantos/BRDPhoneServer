-- CreateTable
CREATE TABLE `fcmToken` (
    `userID_Domain` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `platform` ENUM('IOS', 'Android', 'Extension') NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`userID_Domain`, `platform`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
