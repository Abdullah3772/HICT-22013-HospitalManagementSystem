<?php

// Database configuration for ISHIS backend 
// Values are loaded from environment variables with safe defaults for local dev.

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'ishis');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('API_BASE_URL', '/HICT-22013-HospitalManagementSystem/backend/api.php');


// Comma-separated list of allowed CORS origins (e.g. "http://localhost:5173,https://hospital.example.com").
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173');

// A random secret used to sign JWT-style auth tokens.  MUST be overridden in production.
define('AUTH_SECRET', getenv('AUTH_SECRET') ?: 'CHANGE_ME_IN_PRODUCTION');
