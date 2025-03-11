use new;
DROP TABLE `Users`;
DROP TABLE `Account`;
CREATE TABLE `Users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(50) NOT NULL,
    `user_regnu` VARCHAR(15) UNIQUE NULL,
    `user_phone` VARCHAR(15) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `Account` (
    `account_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `account_number` VARCHAR(255) NOT NULL UNIQUE,
    `bank_name` VARCHAR(255) NULL,
    `balance` DECIMAL(15,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
);
DELETE FROM Users WHERE user_id = 1;

-- Users 테이블에 데이터 삽입
INSERT INTO Users (user_name, user_regnu, user_phone) VALUES
('김철수', '900101-1234567', '010-1234-5678'),
('이영희', '920202-2345678', '010-2345-6789'),
('박민수', '880303-3456789', '010-3456-7890');

-- Account 테이블에 데이터 삽입
INSERT INTO Account (user_id, account_number, bank_name, balance) VALUES
(1, '110-1234-5678', '국민은행', 500000),
(1, '220-9876-5432', '우리은행', 1200000),
(2, '330-5678-1234', '신한은행', 750000),
(3, '440-8765-4321', '하나은행', 2000000);

select * from Users;
select * from Account;