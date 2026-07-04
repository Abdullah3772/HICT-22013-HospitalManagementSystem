import React from 'react';


function AdminDashboard({ user, stats, announcements, onLogout }) {
  return (
    <div className="page-container">
      <section className="section">
        <div className="header-top">
          <div className="left">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user.full_name} ({user.role_name})</p>
          </div>
          <div className="right">
            <button className="button-secondary" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Quick Summary</h2>
        <div className="grid-3">
          <div className="stat-card"><h3>Today's Patients</h3><p>{stats.todays_opd ?? 0}</p></div>
          <div className="stat-card"><h3>Admitted</h3><p>{stats.admitted_patients ?? 0}</p></div>
          <div className="stat-card"><h3>ICU Occupancy</h3><p>{stats.icu_occupancy_rate ?? 0}%</p></div>
        </div>
      </section>

      <section className="section">
        <h2>Active Modules</h2>
        <div className="grid-3">
          {['Patient Registration', 'OPD', 'Ward', 'ICU', 'OT', 'Lab', 'Radiology', 'Pharmacy', 'Maternity', 'Emergency'].map((module) => (
            <div key={module} className="stat-card">
              <h3>{module}</h3>
              <p>Manage system workflow and records.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Latest Announcements</h2>
        <div className="card-list">
          {announcements.length > 0 ? announcements.map((item) => (
            <div key={item.announcement_id} className="card-list-item">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          )) : <p>No announcements available.</p>}
        </div>
      </section>
    </div>
  );
}
export default AdminDashboard;
