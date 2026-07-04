-- ISHIS MySQL schema

DROP DATABASE IF EXISTS ishis;
CREATE DATABASE IF NOT EXISTS ishis DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ishis;

CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE doctors (
  doctor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nic VARCHAR(20) NOT NULL UNIQUE,
  gender ENUM('Male','Female','Other') DEFAULT 'Other',
  specialization VARCHAR(120) DEFAULT NULL,
  department VARCHAR(120) DEFAULT NULL,
  contact_number VARCHAR(50) DEFAULT NULL,
  qualifications VARCHAR(255) DEFAULT NULL,
  medical_registration_number VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patients (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  nic VARCHAR(20) DEFAULT NULL UNIQUE,
  dob DATE DEFAULT NULL,
  age INT DEFAULT NULL,
  gender ENUM('Male','Female','Other') DEFAULT 'Other',
  address TEXT DEFAULT NULL,
  contact_number VARCHAR(50) DEFAULT NULL UNIQUE,
  email VARCHAR(150) DEFAULT NULL,
  emergency_contact_person VARCHAR(150) DEFAULT NULL,
  emergency_contact_number VARCHAR(50) DEFAULT NULL,
  blood_group VARCHAR(10) DEFAULT NULL,
  allergies TEXT DEFAULT NULL,
  existing_diseases TEXT DEFAULT NULL,
  guardian_info TEXT DEFAULT NULL,
  insurance_info TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  posted_by INT DEFAULT NULL,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE hospital_metrics (
  metric_id INT AUTO_INCREMENT PRIMARY KEY,
  metric_key VARCHAR(100) NOT NULL UNIQUE,
  metric_value INT NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT DEFAULT NULL,
  appointment_type VARCHAR(100) DEFAULT 'General',
  appointment_date DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled',
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE opd_consultations (
  consultation_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT DEFAULT NULL,
  chief_complaint VARCHAR(255) DEFAULT NULL,
  current_illness TEXT DEFAULT NULL,
  symptoms TEXT DEFAULT NULL,
  diagnosis TEXT DEFAULT NULL,
  severity ENUM('Mild','Moderate','Severe','Critical') DEFAULT 'Moderate',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescriptions (
  prescription_id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT DEFAULT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(120) DEFAULT NULL,
  frequency VARCHAR(120) DEFAULT NULL,
  duration VARCHAR(120) DEFAULT NULL,
  instructions TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES opd_consultations(consultation_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ward_admissions (
  admission_id INT AUTO_INCREMENT PRIMARY KEY,
  ward_number VARCHAR(64) NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT DEFAULT NULL,
  diagnosis TEXT DEFAULT NULL,
  admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  discharge_date DATETIME DEFAULT NULL,
  discharge_summary TEXT DEFAULT NULL,
  follow_up_instructions TEXT DEFAULT NULL,
  clinic_date DATE DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ward_notes (
  note_id INT AUTO_INCREMENT PRIMARY KEY,
  admission_id INT NOT NULL,
  author_id INT DEFAULT NULL,
  note_type VARCHAR(100) DEFAULT 'Progress',
  note_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admission_id) REFERENCES ward_admissions(admission_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE icu_records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT DEFAULT NULL,
  blood_pressure VARCHAR(50) DEFAULT NULL,
  heart_rate VARCHAR(50) DEFAULT NULL,
  oxygen_saturation VARCHAR(50) DEFAULT NULL,
  temperature VARCHAR(50) DEFAULT NULL,
  respiratory_rate VARCHAR(50) DEFAULT NULL,
  ventilator_status VARCHAR(100) DEFAULT NULL,
  medications TEXT DEFAULT NULL,
  procedures TEXT DEFAULT NULL,
  doctor_notes TEXT DEFAULT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ot_surgeries (
  surgery_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  surgeon_id INT DEFAULT NULL,
  anesthetist_name VARCHAR(255) DEFAULT NULL,
  surgery_date DATETIME NOT NULL,
  surgery_type VARCHAR(255) DEFAULT NULL,
  ot_room_number VARCHAR(100) DEFAULT NULL,
  outcome TEXT DEFAULT NULL,
  recovery_notes TEXT DEFAULT NULL,
  complications TEXT DEFAULT NULL,
  recommendations TEXT DEFAULT NULL,
  follow_up_instructions TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (surgeon_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lab_tests (
  lab_test_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  requested_by INT DEFAULT NULL,
  test_type VARCHAR(150) DEFAULT NULL,
  sample_type VARCHAR(100) DEFAULT NULL,
  status ENUM('Requested','Sample Collected','Processing','Verified','Released') DEFAULT 'Requested',
  result TEXT DEFAULT NULL,
  result_date DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE radiology_tests (
  radiology_test_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  requested_by INT DEFAULT NULL,
  imaging_type VARCHAR(150) DEFAULT NULL,
  findings TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status ENUM('Requested','Processing','Verified','Released') DEFAULT 'Requested',
  report_file VARCHAR(255) DEFAULT NULL,
  result_date DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES doctors(doctor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE medicines (
  medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  expiry_date DATE DEFAULT NULL,
  low_stock_threshold INT DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pharmacy_dispenses (
  dispense_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  prescribed_by INT DEFAULT NULL,
  medicine_id INT NOT NULL,
  dosage VARCHAR(120) DEFAULT NULL,
  quantity INT DEFAULT 1,
  duration VARCHAR(120) DEFAULT NULL,
  instructions TEXT DEFAULT NULL,
  dispensed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (prescribed_by) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
  FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE maternity_records (
  maternity_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  mother_patient_id INT DEFAULT NULL,
  gestation_weeks INT DEFAULT NULL,
  expected_delivery_date DATE DEFAULT NULL,
  risk_level VARCHAR(100) DEFAULT NULL,
  delivery_date DATE DEFAULT NULL,
  delivery_type VARCHAR(120) DEFAULT NULL,
  baby_name VARCHAR(150) DEFAULT NULL,
  baby_gender ENUM('Male','Female','Other') DEFAULT 'Other',
  birth_weight VARCHAR(50) DEFAULT NULL,
  apgar_score VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (mother_patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE emergency_cases (
  emergency_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT DEFAULT NULL,
  case_id VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  age INT DEFAULT NULL,
  gender ENUM('Male','Female','Other') DEFAULT 'Other',
  emergency_condition TEXT DEFAULT NULL,
  arrival_method VARCHAR(120) DEFAULT NULL,
  triage_level ENUM('Red','Orange','Yellow','Green') DEFAULT 'Yellow',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  sender_id INT DEFAULT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patient_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT DEFAULT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (role_name) VALUES
('Super Admin'),
('Hospital Admin'),
('Doctor'),
('Laboratory Staff'),
('Radiology Staff'),
('Pharmacist'),
('Nurse'),
('Receptionist'),
('Patient');

-- Sample seed data — passwords MUST be changed after first login.
-- Use `php backend/install.php` to create the admin with a strong password.
-- The hashes below are placeholders for development only.
INSERT INTO users (user_id, username, password_hash, role_id, full_name, email, phone) VALUES
(1, 'admin', '$2y$10$6bF6aBpH.BZA723Pdq2DK.at9QbA/VkIdxs/legJMmiW6yqYBegyu', 1, 'Super Admin', 'admin@nationalhospital.lk', '0112345678'),
(2, 'drsaman', '$2y$10$EtRlImaRj0Hr/SvIIRDj/O0ktRPh00VyKhn4mTEPab8s4hCdsKk8e', 3, 'Dr. Saman Perera', 'saman.perera@nationalhospital.lk', '+94 77 123 4567'),
(3, 'patient1', '$2y$10$RRNILcKGBNajHgIAqbWznu4DVGNWNEB0RcCvH64G58gwgGOtgmNvK', 9, 'Kamal Silva', 'kamal.silva@example.com', '0771234567');

INSERT INTO doctors (doctor_id, user_id, nic, gender, specialization, department, contact_number, qualifications, medical_registration_number) VALUES
(1, 2, '971234567V', 'Male', 'General Medicine', 'Internal Medicine', '+94 77 123 4567', 'MBBS, MD', 'SLMC-12345');

INSERT INTO patients (patient_id, full_name, nic, dob, age, gender, address, contact_number, email, emergency_contact_person, emergency_contact_number, blood_group, allergies, existing_diseases, guardian_info, insurance_info) VALUES
(1, 'Kamal Silva', '973456789V', '1990-05-12', 34, 'Male', 'No 12, Galle Road, Colombo', '0771234567', 'kamal.silva@example.com', 'Sunil Silva', '0777654321', 'O+', 'None', 'Hypertension', 'Sunil Silva | 0777654321', 'National Health Insurance');

INSERT INTO hospital_metrics (metric_key, metric_value) VALUES
('total_doctors', 24),
('total_staff', 112),
('available_beds', 48),
('admitted_patients', 96),
('todays_opd', 78),
('icu_occupancy_rate', 72);

INSERT INTO announcements (title, body, category, visible) VALUES
('Covid-19 Vaccination Drive', 'Free vaccination available every Monday and Wednesday.', 'Public Health', 1),
('Clinic Schedule', 'OPD clinic schedule updated for the upcoming week.', 'Schedule', 1);

INSERT INTO medicines (name, stock, expiry_date, low_stock_threshold) VALUES
('Paracetamol', 120, '2027-12-31', 15),
('Amoxicillin', 80, '2026-09-30', 10),
('Aspirin', 50, '2027-02-28', 10);
