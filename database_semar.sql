-- ============================================================================
-- DATABASE: Sistem Informasi Seminar Mahasiswa (SEMAR)
-- Dibuat: 17 November 2025
-- Author: Akeyla
-- Database Engine: MySQL 8.0+
-- ============================================================================

-- Buat database baru
CREATE DATABASE IF NOT EXISTS semar_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE semar_db;

-- ============================================================================
-- TABLE 1: users (Mahasiswa, Dosen, Admin)
-- ============================================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('mahasiswa', 'dosen', 'admin') NOT NULL DEFAULT 'mahasiswa',
    npm VARCHAR(20) NULL COMMENT 'Nomor Pokok Mahasiswa',
    nidn VARCHAR(20) NULL COMMENT 'Nomor Induk Dosen Nasional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 2: personal_access_tokens (Sanctum Authentication)
-- ============================================================================

CREATE TABLE personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tokenable (tokenable_type, tokenable_id),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 3: seminars (Pengajuan Seminar)
-- ============================================================================

CREATE TABLE seminars (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id BIGINT UNSIGNED NOT NULL,
    pembimbing1_id BIGINT UNSIGNED NULL,
    pembimbing2_id BIGINT UNSIGNED NULL,
    penguji_id BIGINT UNSIGNED NULL,
    judul VARCHAR(500) NOT NULL,
    tipe ENUM('proposal', 'hasil', 'kompre') NOT NULL,
    abstrak TEXT NULL,
    status ENUM('draft', 'pending_verification', 'approved', 'scheduled', 'finished', 'revising') DEFAULT 'draft',
    skor_total TINYINT UNSIGNED NULL COMMENT 'Nilai akhir 0-100',
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mahasiswa_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pembimbing1_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (pembimbing2_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (penguji_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_mahasiswa (mahasiswa_id),
    INDEX idx_status (status),
    INDEX idx_tipe (tipe)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4: seminar_approvals (Persetujuan Dosen)
-- ============================================================================

CREATE TABLE seminar_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seminar_id BIGINT UNSIGNED NOT NULL,
    dosen_id BIGINT UNSIGNED NOT NULL,
    peran ENUM('pembimbing1', 'pembimbing2', 'penguji') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    catatan TEXT NULL COMMENT 'Alasan penolakan atau catatan',
    available_dates JSON NULL COMMENT 'Tanggal ketersediaan dosen (array of dates)',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_approval (seminar_id, dosen_id, peran),
    INDEX idx_dosen (dosen_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 5: seminar_schedules (Jadwal Seminar)
-- ============================================================================

CREATE TABLE seminar_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seminar_id BIGINT UNSIGNED NOT NULL,
    waktu_mulai DATETIME NOT NULL,
    durasi_menit SMALLINT UNSIGNED DEFAULT 60,
    ruang VARCHAR(100) NULL COMMENT 'Ruangan seminar',
    status ENUM('scheduled', 'ongoing', 'finished', 'canceled') DEFAULT 'scheduled',
    qr_code_path VARCHAR(255) NULL COMMENT 'Path file QR code',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
    
    INDEX idx_waktu (waktu_mulai),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 6: seminar_attendances (Absensi Seminar)
-- ============================================================================

CREATE TABLE seminar_attendances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seminar_schedule_id BIGINT UNSIGNED NOT NULL,
    mahasiswa_id BIGINT UNSIGNED NOT NULL,
    waktu_scan TIMESTAMP NULL COMMENT 'Waktu scan QR code',
    metode ENUM('qr', 'manual') DEFAULT 'qr',
    status ENUM('present', 'late', 'invalid') DEFAULT 'present',
    qr_token VARCHAR(255) NULL COMMENT 'Token QR yang discan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seminar_schedule_id) REFERENCES seminar_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_attendance (seminar_schedule_id, mahasiswa_id),
    INDEX idx_mahasiswa (mahasiswa_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 7: seminar_revisions (Revisi Seminar)
-- ============================================================================

CREATE TABLE seminar_revisions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seminar_id BIGINT UNSIGNED NOT NULL,
    mahasiswa_id BIGINT UNSIGNED NOT NULL,
    nomor_revisi SMALLINT UNSIGNED NOT NULL COMMENT 'Revisi ke-1, ke-2, dst',
    catatan TEXT NOT NULL COMMENT 'Catatan revisi dari mahasiswa',
    file_path VARCHAR(255) NULL COMMENT 'Path file revisi (PDF)',
    status ENUM('submitted', 'reviewed', 'accepted', 'rejected') DEFAULT 'submitted',
    reviewed_by BIGINT UNSIGNED NULL COMMENT 'Admin/dosen yang review',
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_revision (seminar_id, nomor_revisi),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 8: cache (Laravel Cache)
-- ============================================================================

CREATE TABLE cache (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` MEDIUMTEXT NOT NULL,
    expiration INT NOT NULL,
    INDEX idx_expiration (expiration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 9: cache_locks (Laravel Cache Locks)
-- ============================================================================

CREATE TABLE cache_locks (
    `key` VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA: Users (Admin, Dosen, Mahasiswa)
-- Password default untuk semua user: "password123"
-- Hash: $2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK
-- ============================================================================

INSERT INTO users (name, email, password, role, npm, nidn) VALUES
-- Admin
('Admin Sistem', 'admin@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'admin', NULL, NULL),

-- Dosen (10 dosen)
('Dr. Budi Santoso, M.Kom', 'budi.santoso@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0101018901'),
('Dr. Siti Aminah, M.T', 'siti.aminah@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0102019002'),
('Prof. Ahmad Dahlan, Ph.D', 'ahmad.dahlan@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0103018703'),
('Dr. Rina Wijaya, M.Sc', 'rina.wijaya@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0104019104'),
('Dr. Hendra Kusuma, M.Kom', 'hendra.kusuma@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0105018905'),
('Dr. Dewi Lestari, M.T', 'dewi.lestari@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0106019006'),
('Prof. Agus Salim, M.Kom', 'agus.salim@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0107018807'),
('Dr. Lina Marlina, M.Sc', 'lina.marlina@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0108019108'),
('Dr. Eko Prasetyo, M.T', 'eko.prasetyo@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0109018909'),
('Dr. Maya Sari, M.Kom', 'maya.sari@semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'dosen', NULL, '0110019010'),

-- Mahasiswa (15 mahasiswa)
('Andi Wijaya', 'andi.wijaya@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110001', NULL),
('Budi Hartono', 'budi.hartono@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110002', NULL),
('Cindy Permata', 'cindy.permata@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110003', NULL),
('Deni Saputra', 'deni.saputra@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110004', NULL),
('Eka Putri', 'eka.putri@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110005', NULL),
('Fahmi Rahman', 'fahmi.rahman@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110006', NULL),
('Gina Ayu', 'gina.ayu@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110007', NULL),
('Hadi Pratama', 'hadi.pratama@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110008', NULL),
('Indah Sari', 'indah.sari@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110009', NULL),
('Joko Susanto', 'joko.susanto@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110010', NULL),
('Kartika Dewi', 'kartika.dewi@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110011', NULL),
('Lukman Hakim', 'lukman.hakim@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110012', NULL),
('Mega Wati', 'mega.wati@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110013', NULL),
('Nurul Azizah', 'nurul.azizah@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110014', NULL),
('Omar Bakri', 'omar.bakri@student.semar.ac.id', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lHHXngMXCQYK', 'mahasiswa', '2110015', NULL);

-- ============================================================================
-- SAMPLE DATA: Seminars (Pengajuan Seminar)
-- ============================================================================

INSERT INTO seminars (mahasiswa_id, pembimbing1_id, pembimbing2_id, penguji_id, judul, tipe, abstrak, status, verified_at) VALUES
-- Seminar yang sudah scheduled
(12, 2, 3, 4, 'Sistem Informasi Manajemen Perpustakaan Berbasis Web', 'proposal', 
'Penelitian ini bertujuan untuk mengembangkan sistem informasi manajemen perpustakaan yang efisien dan mudah digunakan.', 
'scheduled', NOW()),

(13, 3, 5, 6, 'Aplikasi Mobile Learning Berbasis Android untuk Pembelajaran Matematika', 'proposal',
'Pengembangan aplikasi mobile untuk meningkatkan pemahaman siswa dalam mata pelajaran matematika.',
'scheduled', NOW()),

-- Seminar yang sudah approved (menunggu dijadwalkan)
(14, 4, 6, 7, 'Implementasi Algoritma Machine Learning untuk Prediksi Harga Saham', 'hasil',
'Penelitian menggunakan algoritma Random Forest untuk memprediksi pergerakan harga saham.',
'approved', NOW()),

-- Seminar pending (menunggu approval dosen)
(15, 5, 7, 8, 'Rancang Bangun Sistem Keamanan Rumah dengan IoT', 'proposal',
'Sistem keamanan rumah pintar menggunakan sensor dan teknologi Internet of Things.',
'pending_verification', NULL),

-- Seminar draft (baru diajukan)
(16, 2, 8, 9, 'Analisis Sentimen Media Sosial Menggunakan Natural Language Processing', 'proposal',
'Menganalisis sentimen pengguna di media sosial untuk keperluan riset pemasaran.',
'draft', NULL);

-- ============================================================================
-- SAMPLE DATA: Seminar Approvals
-- ============================================================================

-- Approval untuk seminar ID 1 (sudah semua approve)
INSERT INTO seminar_approvals (seminar_id, dosen_id, peran, status, catatan, approved_at) VALUES
(1, 2, 'pembimbing1', 'approved', 'Proposal bagus, lanjutkan!', NOW()),
(1, 3, 'pembimbing2', 'approved', 'Metodologi sudah jelas', NOW()),
(1, 4, 'penguji', 'approved', 'Siap untuk seminar', NOW());

-- Approval untuk seminar ID 2 (sudah semua approve)
INSERT INTO seminar_approvals (seminar_id, dosen_id, peran, status, catatan, approved_at) VALUES
(2, 3, 'pembimbing1', 'approved', 'Aplikasi menarik', NOW()),
(2, 5, 'pembimbing2', 'approved', 'UI/UX sudah bagus', NOW()),
(2, 6, 'penguji', 'approved', 'Disetujui', NOW());

-- Approval untuk seminar ID 3 (sudah semua approve)
INSERT INTO seminar_approvals (seminar_id, dosen_id, peran, status, catatan, approved_at) VALUES
(3, 4, 'pembimbing1', 'approved', 'Hasil penelitian memuaskan', NOW()),
(3, 6, 'pembimbing2', 'approved', 'Data sudah valid', NOW()),
(3, 7, 'penguji', 'approved', 'Siap untuk seminar hasil', NOW());

-- Approval untuk seminar ID 4 (belum semua approve - pending)
INSERT INTO seminar_approvals (seminar_id, dosen_id, peran, status, catatan, approved_at) VALUES
(4, 5, 'pembimbing1', 'approved', 'Konsep sudah jelas', NOW()),
(4, 7, 'pembimbing2', 'pending', NULL, NULL),
(4, 8, 'penguji', 'pending', NULL, NULL);

-- Approval untuk seminar ID 5 (baru diajukan)
INSERT INTO seminar_approvals (seminar_id, dosen_id, peran, status, catatan, approved_at) VALUES
(5, 2, 'pembimbing1', 'pending', NULL, NULL),
(5, 8, 'pembimbing2', 'pending', NULL, NULL),
(5, 9, 'penguji', 'pending', NULL, NULL);

-- ============================================================================
-- SAMPLE DATA: Seminar Schedules
-- ============================================================================

INSERT INTO seminar_schedules (seminar_id, waktu_mulai, durasi_menit, ruang, status, qr_code_path) VALUES
(1, '2025-11-20 09:00:00', 90, 'Ruang A301', 'scheduled', 'qr_codes/seminar_1_qr.png'),
(2, '2025-11-20 13:00:00', 90, 'Ruang A302', 'scheduled', 'qr_codes/seminar_2_qr.png');

-- ============================================================================
-- SAMPLE DATA: Seminar Attendances (Pre-registration)
-- ============================================================================

-- Mahasiswa yang daftar hadir seminar ID 1
INSERT INTO seminar_attendances (seminar_schedule_id, mahasiswa_id, waktu_scan, metode, status) VALUES
(1, 14, NULL, 'qr', 'present'), -- belum scan
(1, 15, NULL, 'qr', 'present'), -- belum scan
(1, 16, NULL, 'qr', 'present'); -- belum scan

-- Mahasiswa yang daftar hadir seminar ID 2
INSERT INTO seminar_attendances (seminar_schedule_id, mahasiswa_id, waktu_scan, metode, status) VALUES
(2, 12, NULL, 'qr', 'present'), -- belum scan
(2, 16, NULL, 'qr', 'present'); -- belum scan

-- ============================================================================
-- SAMPLE DATA: Seminar Revisions (contoh revisi)
-- ============================================================================

INSERT INTO seminar_revisions (seminar_id, mahasiswa_id, nomor_revisi, catatan, file_path, status, reviewed_by, reviewed_at) VALUES
(1, 12, 1, 'Revisi BAB 2 dan daftar pustaka', 'revisions/seminar_1_rev1.pdf', 'accepted', 1, NOW());

-- ============================================================================
-- VIEWS: Untuk Query yang Sering Digunakan
-- ============================================================================

-- View: Daftar seminar dengan info lengkap
CREATE OR REPLACE VIEW view_seminars_detail AS
SELECT 
    s.id,
    s.judul,
    s.tipe,
    s.status,
    m.name AS mahasiswa_nama,
    m.npm AS mahasiswa_npm,
    d1.name AS pembimbing1_nama,
    d2.name AS pembimbing2_nama,
    d3.name AS penguji_nama,
    s.created_at,
    s.verified_at
FROM seminars s
LEFT JOIN users m ON s.mahasiswa_id = m.id
LEFT JOIN users d1 ON s.pembimbing1_id = d1.id
LEFT JOIN users d2 ON s.pembimbing2_id = d2.id
LEFT JOIN users d3 ON s.penguji_id = d3.id;

-- View: Jadwal seminar dengan info lengkap
CREATE OR REPLACE VIEW view_schedules_detail AS
SELECT 
    ss.id,
    ss.waktu_mulai,
    ss.durasi_menit,
    ss.ruang,
    ss.status,
    s.judul,
    s.tipe,
    m.name AS mahasiswa_nama,
    m.npm AS mahasiswa_npm,
    d1.name AS pembimbing1_nama,
    d2.name AS pembimbing2_nama,
    d3.name AS penguji_nama,
    ss.qr_code_path
FROM seminar_schedules ss
JOIN seminars s ON ss.seminar_id = s.id
JOIN users m ON s.mahasiswa_id = m.id
LEFT JOIN users d1 ON s.pembimbing1_id = d1.id
LEFT JOIN users d2 ON s.pembimbing2_id = d2.id
LEFT JOIN users d3 ON s.penguji_id = d3.id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure: Cek semua dosen sudah approve
CREATE PROCEDURE sp_check_all_approved(IN seminar_id_param BIGINT, OUT all_approved BOOLEAN)
BEGIN
    DECLARE approved_count INT;
    
    SELECT COUNT(*) INTO approved_count
    FROM seminar_approvals
    WHERE seminar_id = seminar_id_param 
    AND status = 'approved';
    
    IF approved_count = 3 THEN
        SET all_approved = TRUE;
    ELSE
        SET all_approved = FALSE;
    END IF;
END //

-- Procedure: Hitung jumlah seminar yang dihadiri mahasiswa
CREATE PROCEDURE sp_count_attendance(IN mahasiswa_id_param BIGINT, OUT total_attended INT)
BEGIN
    SELECT COUNT(*) INTO total_attended
    FROM seminar_attendances
    WHERE mahasiswa_id = mahasiswa_id_param
    AND waktu_scan IS NOT NULL
    AND status IN ('present', 'late');
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Auto update status seminar ketika semua dosen approve
CREATE TRIGGER after_approval_update
AFTER UPDATE ON seminar_approvals
FOR EACH ROW
BEGIN
    DECLARE approved_count INT;
    
    SELECT COUNT(*) INTO approved_count
    FROM seminar_approvals
    WHERE seminar_id = NEW.seminar_id
    AND status = 'approved';
    
    IF approved_count = 3 THEN
        UPDATE seminars 
        SET status = 'approved', 
            verified_at = NOW()
        WHERE id = NEW.seminar_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- INDEXES TAMBAHAN untuk Performa
-- ============================================================================

CREATE INDEX idx_seminars_composite ON seminars(mahasiswa_id, status, tipe);
CREATE INDEX idx_schedules_waktu_status ON seminar_schedules(waktu_mulai, status);
CREATE INDEX idx_attendances_composite ON seminar_attendances(mahasiswa_id, status);

-- ============================================================================
-- GRANT PRIVILEGES (Opsional - untuk multi-user)
-- ============================================================================

-- CREATE USER 'semar_user'@'localhost' IDENTIFIED BY 'semar_password_2025';
-- GRANT ALL PRIVILEGES ON semar_db.* TO 'semar_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- INFORMASI DATABASE
-- ============================================================================

SELECT 'Database SEMAR berhasil dibuat!' AS Status;
SELECT 'Total Tables: 9' AS Info;
SELECT 'Sample Data: 1 Admin, 10 Dosen, 15 Mahasiswa, 5 Seminar' AS Data;
SELECT 'Default Password untuk semua user: password123' AS Login;
SELECT '============================================' AS Separator;
SELECT 'Login Credentials:' AS Info;
SELECT '  Admin: admin@semar.ac.id / password123' AS Admin;
SELECT '  Dosen: budi.santoso@semar.ac.id / password123' AS Dosen;
SELECT '  Mahasiswa: cindy.permata@student.semar.ac.id / password123' AS Mahasiswa;
SELECT '============================================' AS Separator;

-- ============================================================================
-- SELESAI
-- ============================================================================
