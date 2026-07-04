<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

// --- Security headers ---
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-XSS-Protection: 1; mode=block');

// --- Restricted CORS ---
$allowedOrigins = array_map('trim', explode(',', CORS_ALLOWED_ORIGINS));
$requestOrigin  = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---- Lightweight HMAC-based token helpers ----
function generateAuthToken(array $payload): string {
    $payload['iat'] = time();
    $payload['exp'] = time() + 28800; // 8 hours
    $data = base64_encode(json_encode($payload));
    $sig  = hash_hmac('sha256', $data, AUTH_SECRET);
    return $data . '.' . $sig;
}

function verifyAuthToken(string $token): ?array {
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    [$data, $sig] = $parts;
    if (!hash_equals(hash_hmac('sha256', $data, AUTH_SECRET), $sig)) return null;
    $payload = json_decode(base64_decode($data), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function requireAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/', $header, $m)) {
        $payload = verifyAuthToken($m[1]);
        if ($payload) return $payload;
    }
    respond(['error' => 'Authentication required'], 401);
    exit;
}

function requireRole(array $allowed): array {
    $user = requireAuth();
    if (!in_array($user['role'] ?? '', $allowed, true)) {
        respond(['error' => 'Insufficient permissions'], 403);
        exit;
    }
    return $user;
}


function connect() {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    return new PDO($dsn, DB_USER, DB_PASS, $options);
}

/**
 * Send a JSON response and terminate execution.
 *
 * @param mixed $data  Response payload.
 * @param int   $status HTTP status code.
 */
function respond(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getRoleId(PDO $db, string $roleName) {
    $stmt = $db->prepare('SELECT role_id FROM roles WHERE role_name = ?');
    $stmt->execute([$roleName]);
    return $stmt->fetchColumn();
}

function createUser(PDO $db, string $username, string $password, string $roleName, string $fullName, ?string $email = null, ?string $phone = null) {
    $roleId = getRoleId($db, $roleName);
    if (!$roleId) {
        throw new Exception('Role not found: ' . $roleName);
    }
    $stmt = $db->prepare('INSERT INTO users (username, password_hash, role_id, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $roleId, $fullName, $email, $phone]);
    return $db->lastInsertId();
}

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = connect();

    switch ($action) {
        case 'login':
            if ($method !== 'POST') respond(['error' => 'Login requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['patient_id']) && isset($input['nic'])) {
                $patientId = $input['patient_id'];
                $nic = $input['nic'];
                $stmt = $db->prepare('SELECT * FROM patients WHERE patient_id = ? AND nic = ?');
                $stmt->execute([$patientId, $nic]);
                $patient = $stmt->fetch();
                if (!$patient) {
                    respond(['error' => 'Invalid patient credentials'], 401);
                }
                $patientUser = [
                    'role_name' => 'Patient',
                    'full_name' => $patient['full_name'],
                    'patient_id' => $patient['patient_id'],
                    'email' => $patient['email'],
                    'phone' => $patient['contact_number'],
                ];
                $token = generateAuthToken([
                    'patient_id' => $patient['patient_id'],
                    'role'       => 'Patient',
                ]);
                respond(['user' => $patientUser, 'token' => $token]);
            }
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            if (!$username || !$password) {
                respond(['error' => 'Missing credentials'], 400);
            }
            $stmt = $db->prepare('SELECT u.user_id, u.username, u.password_hash, u.full_name, u.email, u.phone, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = ?');
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            if (!$user || !password_verify($password, $user['password_hash'])) {
                respond(['error' => 'Invalid username or password'], 401);
            }
            unset($user['password_hash']);
            if ($user['role_name'] === 'Doctor') {
                $stmt = $db->prepare('SELECT doctor_id FROM doctors WHERE user_id = ?');
                $stmt->execute([$user['user_id']]);
                $user['doctor_id'] = $stmt->fetchColumn() ?: null;
            }
            $token = generateAuthToken([
                'user_id'   => $user['user_id'],
                'role'      => $user['role_name'],
                'doctor_id' => $user['doctor_id'] ?? null,
            ]);
            respond(['user' => $user, 'token' => $token]);
            break;

        case 'announcements':
            $stmt = $db->query('SELECT announcement_id, title, body, category, created_at FROM announcements WHERE visible = 1 ORDER BY created_at DESC LIMIT 10');
            respond(['announcements' => $stmt->fetchAll()]);
            break;

        case 'addAnnouncement':
            requireRole(['Super Admin', 'Hospital Admin']);
            if ($method !== 'POST') respond(['error' => 'Announcement requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $title = $input['title'] ?? '';
            $body = $input['body'] ?? '';
            $category = $input['category'] ?? 'General';
            $postedBy = $input['posted_by'] ?? null;
            if (!$title || !$body) {
                respond(['error' => 'Title and body are required'], 400);
            }
            $stmt = $db->prepare('INSERT INTO announcements (title, body, category, posted_by) VALUES (?, ?, ?, ?)');
            $stmt->execute([$title, $body, $category, $postedBy]);
            respond(['message' => 'Announcement created successfully']);
            break;

        case 'deleteAnnouncement':
            requireRole(['Super Admin', 'Hospital Admin']);
            if ($method !== 'POST') respond(['error' => 'Announcement delete requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $announcementId = isset($input['announcement_id']) ? (int)$input['announcement_id'] : 0;
            if (!$announcementId) {
                respond(['error' => 'Announcement ID is required'], 400);
            }
            $stmt = $db->prepare('UPDATE announcements SET visible = 0 WHERE announcement_id = ?');
            $stmt->execute([$announcementId]);
            respond(['message' => 'Announcement removed successfully']);
            break;

        case 'stats':
            $stmt = $db->query('SELECT metric_key, metric_value FROM hospital_metrics');
            $rows = $stmt->fetchAll();
            $stats = [];
            foreach ($rows as $row) {
                $stats[$row['metric_key']] = (int)$row['metric_value'];
            }
            respond(['stats' => $stats]);
            break;

        case 'listDoctors':
            requireAuth();
            $stmt = $db->query('SELECT d.doctor_id, u.username, u.full_name, d.nic, d.gender, d.specialization, d.department, d.contact_number, d.qualifications, d.medical_registration_number, u.email FROM doctors d JOIN users u ON d.user_id = u.user_id ORDER BY u.full_name');
            respond(['doctors' => $stmt->fetchAll()]);
            break;

        case 'createDoctor':
            requireRole(['Super Admin', 'Hospital Admin']);
            if ($method !== 'POST') respond(['error' => 'Doctor creation requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $required = ['username','password','full_name','nic'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    respond(['error' => 'Missing field: ' . $field], 400);
                }
            }
            $userId = createUser($db, $input['username'], $input['password'], 'Doctor', $input['full_name'], $input['email'] ?? null, $input['contact_number'] ?? null);
            $stmt = $db->prepare('INSERT INTO doctors (user_id, nic, gender, specialization, department, contact_number, qualifications, medical_registration_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $userId,
                $input['nic'],
                $input['gender'] ?? 'Other',
                $input['specialization'] ?? null,
                $input['department'] ?? null,
                $input['contact_number'] ?? null,
                $input['qualifications'] ?? null,
                $input['medical_registration_number'] ?? null
            ]);
            $doctorId = $db->lastInsertId();
            respond(['message' => 'Doctor created successfully', 'doctor_id' => $doctorId]);
            break;

        case 'updateDoctor':
            requireRole(['Super Admin', 'Hospital Admin']);
            if ($method !== 'POST') respond(['error' => 'Doctor update requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['doctor_id'])) {
                respond(['error' => 'Missing doctor_id'], 400);
            }
            

            $stmt = $db->prepare('SELECT user_id FROM doctors WHERE doctor_id = ?');
            $stmt->execute([$input['doctor_id']]);
            $doctor = $stmt->fetch();
            if (!$doctor) {
                respond(['error' => 'Doctor not found'], 404);
            }

            $userFields = [];
            $userParams = [];

            if (isset($input['username']) && $input['username'] !== '') {
                $userFields[] = 'username = ?';
                $userParams[] = $input['username'];
            }
            if (isset($input['full_name']) && $input['full_name'] !== '') {
                $userFields[] = 'full_name = ?';
                $userParams[] = $input['full_name'];
            }
            if (isset($input['email'])) {
                $userFields[] = 'email = ?';
                $userParams[] = $input['email'] ?: null;
            }
            if (isset($input['contact_number'])) {
                $userFields[] = 'phone = ?';
                $userParams[] = $input['contact_number'] ?: null;
            }
            if (isset($input['password']) && $input['password'] !== '') {
                $userFields[] = 'password_hash = ?';
                $userParams[] = password_hash($input['password'], PASSWORD_DEFAULT);
            }

            if (count($userFields) > 0) {
                $userParams[] = $doctor['user_id'];
                $stmt = $db->prepare('UPDATE users SET ' . implode(', ', $userFields) . ' WHERE user_id = ?');
                $stmt->execute($userParams);
            }

            $doctorFields = [];
            $doctorParams = [];

            if (isset($input['nic'])) {
                $doctorFields[] = 'nic = ?';
                $doctorParams[] = $input['nic'];
            }
            if (isset($input['gender'])) {
                $doctorFields[] = 'gender = ?';
                $doctorParams[] = $input['gender'];
            }
            if (isset($input['specialization'])) {
                $doctorFields[] = 'specialization = ?';
                $doctorParams[] = $input['specialization'] ?: null;
            }
            if (isset($input['department'])) {
                $doctorFields[] = 'department = ?';
                $doctorParams[] = $input['department'] ?: null;
            }
            if (isset($input['contact_number'])) {
                $doctorFields[] = 'contact_number = ?';
                $doctorParams[] = $input['contact_number'] ?: null;
            }
            if (isset($input['qualifications'])) {
                $doctorFields[] = 'qualifications = ?';
                $doctorParams[] = $input['qualifications'] ?: null;
            }
            if (isset($input['medical_registration_number'])) {
                $doctorFields[] = 'medical_registration_number = ?';
                $doctorParams[] = $input['medical_registration_number'] ?: null;
            }

            if (count($doctorFields) > 0) {
                $doctorParams[] = $input['doctor_id'];
                $stmt = $db->prepare('UPDATE doctors SET ' . implode(', ', $doctorFields) . ' WHERE doctor_id = ?');
                $stmt->execute($doctorParams);
            }

            respond(['message' => 'Doctor updated successfully']);
            break;

        case 'listPatients':
            requireAuth();
            $stmt = $db->query('SELECT patient_id, full_name, nic, dob, age, gender, contact_number, email, emergency_contact_person, emergency_contact_number, blood_group, allergies, existing_diseases FROM patients ORDER BY created_at DESC LIMIT 100');
            respond(['patients' => $stmt->fetchAll()]);
            break;

        case 'nextPatientId':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Next patient ID lookup requires GET'], 405);
            $stmt = $db->query('SELECT IFNULL(MAX(patient_id), 0) + 1 AS next_id FROM patients');
            $nextPatientId = $stmt->fetchColumn();
            respond(['next_patient_id' => $nextPatientId]);
            break;

        case 'checkPatientDuplicate':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Duplicate check requires GET'], 405);
            $nic = $_GET['nic'] ?? null;
            $contact = $_GET['contact_number'] ?? null;
            $duplicates = [];
            if ($nic) {
                $stmt = $db->prepare('SELECT patient_id, full_name FROM patients WHERE nic = ?');
                $stmt->execute([$nic]);
                $duplicates['nic'] = $stmt->fetch();
            }
            if ($contact) {
                $stmt = $db->prepare('SELECT patient_id, full_name FROM patients WHERE contact_number = ?');
                $stmt->execute([$contact]);
                $duplicates['contact_number'] = $stmt->fetch();
            }
            respond(['duplicates' => $duplicates]);
            break;

        case 'registerPatient':
            requireAuth();
            if ($method !== 'POST') respond(['error' => 'Patient registration requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $fields = [
                'full_name','nic','dob','age','gender','address','contact_number','email',
                'emergency_contact_person','emergency_contact_number','blood_group','allergies',
                'existing_diseases','guardian_info','insurance_info'
            ];
            $values = [];
            foreach ($fields as $field) {
                $values[] = $input[$field] ?? null;
            }
            $patientId = !empty($input['patient_id']) ? $input['patient_id'] : null;
            if ($patientId) {
                $check = $db->prepare('SELECT COUNT(*) FROM patients WHERE patient_id = ?');
                $check->execute([$patientId]);
                if ($check->fetchColumn()) {
                    $stmt = $db->prepare('UPDATE patients SET full_name = ?, nic = ?, dob = ?, age = ?, gender = ?, address = ?, contact_number = ?, email = ?, emergency_contact_person = ?, emergency_contact_number = ?, blood_group = ?, allergies = ?, existing_diseases = ?, guardian_info = ?, insurance_info = ? WHERE patient_id = ?');
                    $stmt->execute(array_merge($values, [$patientId]));
                    respond(['message' => 'Patient updated successfully', 'patient_id' => $patientId]);
                }

                $stmt = $db->prepare('INSERT INTO patients (patient_id, full_name, nic, dob, age, gender, address, contact_number, email, emergency_contact_person, emergency_contact_number, blood_group, allergies, existing_diseases, guardian_info, insurance_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute(array_merge([$patientId], $values));
                respond(['message' => 'Patient registered successfully', 'patient_id' => $patientId]);
            }

            $stmt = $db->prepare('INSERT INTO patients (full_name, nic, dob, age, gender, address, contact_number, email, emergency_contact_person, emergency_contact_number, blood_group, allergies, existing_diseases, guardian_info, insurance_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute($values);
            respond(['message' => 'Patient registered successfully', 'patient_id' => $db->lastInsertId()]);
            break;

        case 'patientById':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Patient lookup requires GET'], 405);
            $patientId = $_GET['patient_id'] ?? null;
            if (!$patientId) respond(['error' => 'Missing patient_id'], 400);
            $stmt = $db->prepare('SELECT * FROM patients WHERE patient_id = ?');
            $stmt->execute([$patientId]);
            $patient = $stmt->fetch();
            if (!$patient) respond(['error' => 'Patient not found'], 404);
            respond(['patient' => $patient]);
            break;

        case 'patientByNIC':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Patient lookup requires GET'], 405);
            $nic = $_GET['nic'] ?? null;
            if (!$nic) respond(['error' => 'Missing nic'], 400);
            $stmt = $db->prepare('SELECT * FROM patients WHERE nic = ?');
            $stmt->execute([$nic]);
            $patient = $stmt->fetch();
            if (!$patient) respond(['error' => 'Patient not found'], 404);
            respond(['patient' => $patient]);
            break;

        case 'patientByContact':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Patient lookup requires GET'], 405);
            $contact = $_GET['contact_number'] ?? null;
            if (!$contact) respond(['error' => 'Missing contact_number'], 400);
            $stmt = $db->prepare('SELECT * FROM patients WHERE contact_number = ?');
            $stmt->execute([$contact]);
            $patient = $stmt->fetch();
            if (!$patient) respond(['error' => 'Patient not found'], 404);
            respond(['patient' => $patient]);
            break;

        case 'patientHistory':
            requireAuth();
            if ($method !== 'GET') respond(['error' => 'Patient history requires GET'], 405);
            $patientId = $_GET['patient_id'] ?? null;
            if (!$patientId) respond(['error' => 'Missing patient_id'], 400);
            $response = [];
            $stmt = $db->prepare('SELECT * FROM opd_consultations WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['consultations'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['prescriptions'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM lab_tests WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['lab_tests'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM radiology_tests WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['radiology_tests'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM ward_admissions WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['ward_admissions'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM icu_records WHERE patient_id = ? ORDER BY recorded_at DESC');
            $stmt->execute([$patientId]);
            $response['icu_records'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM ot_surgeries WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['ot_surgeries'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM maternity_records WHERE patient_id = ? ORDER BY created_at DESC');
            $stmt->execute([$patientId]);
            $response['maternity_records'] = $stmt->fetchAll();
            respond($response);
            break;

        case 'opdConsultation':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor']);
            if ($method !== 'POST') respond(['error' => 'OPD consultation requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $required = ['patient_id','doctor_id'];
            foreach ($required as $field) {
                if (empty($input[$field])) respond(['error' => 'Missing field: ' . $field], 400);
            }
            $stmt = $db->prepare('INSERT INTO opd_consultations (patient_id, doctor_id, chief_complaint, current_illness, symptoms, diagnosis, severity) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'],
                $input['doctor_id'],
                $input['chief_complaint'] ?? null,
                $input['current_illness'] ?? null,
                $input['symptoms'] ?? null,
                $input['diagnosis'] ?? null,
                $input['severity'] ?? 'Moderate'
            ]);
            $consultationId = $db->lastInsertId();
            if (!empty($input['prescriptions']) && is_array($input['prescriptions'])) {
                $stmt = $db->prepare('INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                foreach ($input['prescriptions'] as $prescription) {
                    $stmt->execute([
                        $consultationId,
                        $input['patient_id'],
                        $input['doctor_id'],
                        $prescription['medicine_name'] ?? '',
                        $prescription['dosage'] ?? null,
                        $prescription['frequency'] ?? null,
                        $prescription['duration'] ?? null,
                        $prescription['instructions'] ?? null
                    ]);
                }
            }
            respond(['message' => 'OPD consultation saved successfully']);
            break;

        case 'wardAdmission':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']);
            if ($method !== 'POST') respond(['error' => 'Ward admission requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO ward_admissions (ward_number, patient_id, doctor_id, diagnosis, admission_date, discharge_date, discharge_summary, follow_up_instructions, clinic_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['ward_number'] ?? '',
                $input['patient_id'] ?? null,
                $input['doctor_id'] ?? null,
                $input['diagnosis'] ?? null,
                $input['admission_date'] ?? date('Y-m-d H:i:s'),
                $input['discharge_date'] ?? null,
                $input['discharge_summary'] ?? null,
                $input['follow_up_instructions'] ?? null,
                $input['clinic_date'] ?? null
            ]);
            respond(['message' => 'Ward admission recorded successfully']);
            break;

        case 'wardNotes':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']);
            if ($method !== 'POST') respond(['error' => 'Ward note requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO ward_notes (admission_id, author_id, note_type, note_text) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $input['admission_id'] ?? null,
                $input['author_id'] ?? null,
                $input['note_type'] ?? 'Progress',
                $input['note_text'] ?? ''
            ]);
            respond(['message' => 'Ward note saved successfully']);
            break;

        case 'icuRecord':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']);
            if ($method !== 'POST') respond(['error' => 'ICU record requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO icu_records (patient_id, doctor_id, blood_pressure, heart_rate, oxygen_saturation, temperature, respiratory_rate, ventilator_status, medications, procedures, doctor_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['doctor_id'] ?? null,
                $input['blood_pressure'] ?? null,
                $input['heart_rate'] ?? null,
                $input['oxygen_saturation'] ?? null,
                $input['temperature'] ?? null,
                $input['respiratory_rate'] ?? null,
                $input['ventilator_status'] ?? null,
                $input['medications'] ?? null,
                $input['procedures'] ?? null,
                $input['doctor_notes'] ?? null
            ]);
            respond(['message' => 'ICU record saved successfully']);
            break;

        case 'otSurgery':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor']);
            if ($method !== 'POST') respond(['error' => 'OT scheduling requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO ot_surgeries (patient_id, surgeon_id, anesthetist_name, surgery_date, surgery_type, ot_room_number, outcome, recovery_notes, complications, recommendations, follow_up_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['surgeon_id'] ?? null,
                $input['anesthetist_name'] ?? null,
                $input['surgery_date'] ?? date('Y-m-d H:i:s'),
                $input['surgery_type'] ?? null,
                $input['ot_room_number'] ?? null,
                $input['outcome'] ?? null,
                $input['recovery_notes'] ?? null,
                $input['complications'] ?? null,
                $input['recommendations'] ?? null,
                $input['follow_up_instructions'] ?? null
            ]);
            respond(['message' => 'Surgery scheduled successfully']);
            break;

        case 'labRequest':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Laboratory Staff']);
            if ($method !== 'POST') respond(['error' => 'Lab request requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO lab_tests (patient_id, requested_by, test_type, sample_type, status) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['requested_by'] ?? null,
                $input['test_type'] ?? null,
                $input['sample_type'] ?? null,
                'Requested'
            ]);
            respond(['message' => 'Laboratory request created successfully']);
            break;

        case 'labReport':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Laboratory Staff']);
            if ($method !== 'POST') respond(['error' => 'Lab report update requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('UPDATE lab_tests SET result = ?, status = ?, result_date = ? WHERE lab_test_id = ?');
            $stmt->execute([
                $input['result'] ?? null,
                $input['status'] ?? 'Verified',
                $input['result_date'] ?? date('Y-m-d H:i:s'),
                $input['lab_test_id'] ?? null
            ]);
            respond(['message' => 'Laboratory report updated successfully']);
            break;

        case 'radiologyRequest':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Radiology Staff']);
            if ($method !== 'POST') respond(['error' => 'Radiology request requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO radiology_tests (patient_id, requested_by, imaging_type, status) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['requested_by'] ?? null,
                $input['imaging_type'] ?? null,
                'Requested'
            ]);
            respond(['message' => 'Radiology request created successfully']);
            break;

        case 'radiologyReport':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Radiology Staff']);
            if ($method !== 'POST') respond(['error' => 'Radiology report update requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('UPDATE radiology_tests SET findings = ?, notes = ?, status = ?, result_date = ?, report_file = ? WHERE radiology_test_id = ?');
            $stmt->execute([
                $input['findings'] ?? null,
                $input['notes'] ?? null,
                $input['status'] ?? 'Verified',
                $input['result_date'] ?? date('Y-m-d H:i:s'),
                $input['report_file'] ?? null,
                $input['radiology_test_id'] ?? null
            ]);
            respond(['message' => 'Radiology report updated successfully']);
            break;

        case 'medicines':
            requireAuth();
            $stmt = $db->query('SELECT * FROM medicines ORDER BY name');
            respond(['medicines' => $stmt->fetchAll()]);
            break;

        case 'addMedicine':
            requireRole(['Super Admin', 'Hospital Admin', 'Pharmacist']);
            if ($method !== 'POST') respond(['error' => 'Medicine creation requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO medicines (name, stock, expiry_date, low_stock_threshold) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $input['name'] ?? null,
                $input['stock'] ?? 0,
                $input['expiry_date'] ?? null,
                $input['low_stock_threshold'] ?? 10
            ]);
            respond(['message' => 'Medicine added successfully']);
            break;

        case 'pharmacyDispense':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Pharmacist']);
            if ($method !== 'POST') respond(['error' => 'Pharmacy dispense requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO pharmacy_dispenses (patient_id, prescribed_by, medicine_id, dosage, quantity, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['prescribed_by'] ?? null,
                $input['medicine_id'] ?? null,
                $input['dosage'] ?? null,
                $input['quantity'] ?? 1,
                $input['duration'] ?? null,
                $input['instructions'] ?? null
            ]);
            if (!empty($input['medicine_id']) && !empty($input['quantity'])) {
                $update = $db->prepare('UPDATE medicines SET stock = GREATEST(stock - ?, 0) WHERE medicine_id = ?');
                $update->execute([$input['quantity'], $input['medicine_id']]);
            }
            respond(['message' => 'Medication dispensed successfully']);
            break;

        case 'maternityRecord':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']);
            if ($method !== 'POST') respond(['error' => 'Maternity record requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare('INSERT INTO maternity_records (patient_id, mother_patient_id, gestation_weeks, expected_delivery_date, risk_level, delivery_date, delivery_type, baby_name, baby_gender, birth_weight, apgar_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $input['mother_patient_id'] ?? null,
                $input['gestation_weeks'] ?? null,
                $input['expected_delivery_date'] ?? null,
                $input['risk_level'] ?? null,
                $input['delivery_date'] ?? null,
                $input['delivery_type'] ?? null,
                $input['baby_name'] ?? null,
                $input['baby_gender'] ?? null,
                $input['birth_weight'] ?? null,
                $input['apgar_score'] ?? null
            ]);
            respond(['message' => 'Maternity record created successfully']);
            break;

        case 'emergencyCase':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist']);
            if ($method !== 'POST') respond(['error' => 'Emergency case requires POST'], 405);
            $input = json_decode(file_get_contents('php://input'), true);
            $caseId = 'EMG-' . strtoupper(substr(md5(uniqid('', true)), 0, 8));
            $stmt = $db->prepare('INSERT INTO emergency_cases (patient_id, case_id, name, age, gender, emergency_condition, arrival_method, triage_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['patient_id'] ?? null,
                $caseId,
                $input['name'] ?? null,
                $input['age'] ?? null,
                $input['gender'] ?? 'Other',
                $input['emergency_condition'] ?? null,
                $input['arrival_method'] ?? null,
                $input['triage_level'] ?? 'Yellow'
            ]);
            respond(['message' => 'Emergency case created successfully', 'case_id' => $caseId]);
            break;

        case 'doctorDashboard':
            requireRole(['Super Admin', 'Hospital Admin', 'Doctor']);
            $doctorId = $_GET['doctor_id'] ?? null;
            if (!$doctorId) respond(['error' => 'Missing doctor_id'], 400);
            $response = [];
            $stmt = $db->prepare('SELECT COUNT(*) as upcoming FROM appointments WHERE doctor_id = ? AND appointment_date >= NOW() AND status = ?');
            $stmt->execute([$doctorId, 'Scheduled']);
            $response['upcoming_appointments'] = (int)$stmt->fetchColumn();
            $stmt = $db->prepare('SELECT COUNT(*) as pending FROM opd_consultations WHERE doctor_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
            $stmt->execute([$doctorId]);
            $response['recent_consultations'] = (int)$stmt->fetchColumn();
            respond($response);
            break;

        case 'patientDashboard':
            requireAuth();
            $patientId = $_GET['patient_id'] ?? null;
            if (!$patientId) respond(['error' => 'Missing patient_id'], 400);
            $response = [];
            $stmt = $db->prepare('SELECT * FROM patients WHERE patient_id = ?');
            $stmt->execute([$patientId]);
            $response['patient'] = $stmt->fetch();
            $stmt = $db->prepare('SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 10');
            $stmt->execute([$patientId]);
            $response['appointments'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10');
            $stmt->execute([$patientId]);
            $response['prescriptions'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM lab_tests WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10');
            $stmt->execute([$patientId]);
            $response['lab_reports'] = $stmt->fetchAll();
            $stmt = $db->prepare('SELECT * FROM radiology_tests WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10');
            $stmt->execute([$patientId]);
            $response['radiology_reports'] = $stmt->fetchAll();
            respond($response);
            break;

        default:
            respond(['error' => 'Action not found or not supported'], 404);
    }
} catch (PDOException $ex) {
    error_log('ISHIS DB error: ' . $ex->getMessage());
    respond(['error' => 'A database error occurred. Please try again later.'], 500);
} catch (Exception $ex) {
    error_log('ISHIS error: ' . $ex->getMessage());
    respond(['error' => 'An unexpected error occurred.'], 500);
}
