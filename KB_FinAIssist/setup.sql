CREATE DATABASE KB_FinAIssist_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'KB_FinAIssist'@'localhost' IDENTIFIED BY 'KB_FinAIssist_1234';
GRANT ALL PRIVILEGES ON KB_FinAIssist_db_test.* TO 'KB_FinAIssist'@'localhost';
FLUSH PRIVILEGES;