# Integrated Smart Hospital Information System (ISHIS)

This project is a full-stack hospital management system using React for the frontend, PHP for the backend API, and MySQL for the database.

## Structure

- `frontend/` — React + Vite application for public website, login, and dashboard.
- `backend/` — PHP REST API endpoints. (HICT/2022/39)
- `db.sql` — MySQL schema and initial table definitions.

## Setup

1. Install dependencies for the frontend:
   - Open a terminal in `frontend/`
   - Run `npm install`

2. Configure the database:
   - Create a MySQL database named `ishis`
   - Import `db.sql`

3. Configure backend database connection:
   - Update `backend/config.php` with your MySQL credentials.

4. Create the initial admin user:
   - Run `php backend/install.php` from the project root, or open `http://localhost/HICT-22013-Hospital-Management-System/backend/install.php` in your browser.

5. Run the backend under XAMPP:
   - Put `backend/` inside your Apache document root or use this project folder as the site root.
   - Access API endpoints like `http://localhost/HICT-22013-Hospital-Management-System/backend/api.php`.

5. Run the frontend:
   - From `frontend/`, use `npm run dev`
   - Open the local Vite URL (usually `http://localhost:5173`)

## Notes

- The frontend connects to the backend via REST calls.
- The backend uses secure password hashing and role-based access control.
- The database schema includes users, doctors, patients, announcements, and basic hospital metrics.
