-- CreateTable
CREATE TABLE `bus_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_number` VARCHAR(50) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `bus_number`(`bus_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_name` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'inactive',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `captain_complaints` (
    `complaintID` INTEGER NOT NULL AUTO_INCREMENT,
    `captainID` INTEGER NULL,
    `message` TEXT NOT NULL,
    `timestamp` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` VARCHAR(20) NULL DEFAULT 'Pending',

    INDEX `captainID`(`captainID`),
    PRIMARY KEY (`complaintID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `captains` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'inactive',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `dob` DATE NOT NULL,
    `cnic` VARCHAR(15) NOT NULL,
    `cnic_picture` VARCHAR(255) NULL,
    `driving_license` VARCHAR(20) NOT NULL,
    `driving_license_picture` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `alternate_phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `route_name` VARCHAR(100) NULL,
    `bus_no` VARCHAR(50) NULL,
    `password` VARCHAR(255) NULL,
    `route_id` INTEGER NULL,

    UNIQUE INDEX `cnic`(`cnic`),
    UNIQUE INDEX `driving_license`(`driving_license`),
    UNIQUE INDEX `email`(`email`),
    INDEX `route_name`(`route_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,
    `email` VARCHAR(100) NULL,
    `message` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `registration_number` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `route_name` VARCHAR(100) NOT NULL,
    `stop_name` VARCHAR(100) NOT NULL,
    `timestamp` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `invoiceID` INTEGER NOT NULL AUTO_INCREMENT,
    `studentID` INTEGER NULL,
    `imagePath` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `timestamp` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `studentID`(`studentID`),
    PRIMARY KEY (`invoiceID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route_name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `route_name`(`route_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stop_name` VARCHAR(100) NOT NULL,
    `route_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `route_id`(`route_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_feedback` (
    `feedbackID` INTEGER NOT NULL AUTO_INCREMENT,
    `studentID` INTEGER NULL,
    `message` TEXT NOT NULL,
    `timestamp` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `studentID`(`studentID`),
    PRIMARY KEY (`feedbackID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(50) NULL,
    `last_name` VARCHAR(50) NULL,
    `email` VARCHAR(100) NULL,
    `password` VARCHAR(255) NULL,
    `registration_number` VARCHAR(50) NULL,
    `semester` VARCHAR(20) NULL,
    `route_name` VARCHAR(255) NULL,
    `stop_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `emergency_contact` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `picture` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `captain_complaints` ADD CONSTRAINT `captain_complaints_ibfk_1` FOREIGN KEY (`captainID`) REFERENCES `captains`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `captains` ADD CONSTRAINT `captains_ibfk_1` FOREIGN KEY (`route_name`) REFERENCES `routes`(`route_name`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`studentID`) REFERENCES `students`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stops` ADD CONSTRAINT `stops_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `student_feedback` ADD CONSTRAINT `student_feedback_ibfk_1` FOREIGN KEY (`studentID`) REFERENCES `students`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

