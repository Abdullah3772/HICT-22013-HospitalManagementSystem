import { useMemo, useState } from 'react';
import { Box, Button, Divider, Grid, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import {
  PatientRegistration,
  DoctorManagement,
  OPDModule,
  WardManagement,
  ICUModule,
  OTModule,
  LaboratoryModule,
  RadiologyModule,
  PharmacyModule,
  MaternityModule,
  EmergencyModule,
  DoctorDashboard,
  PatientDashboard,
  AnnouncementsManager,
  DashboardSummary,
} 
from './Modules';
const moduleMap = {
  dashboardHome: { label: 'Dashboard Home', component: DashboardSummary },
  doctorManagement: { label: 'Doctor Management', component: DoctorManagement },
  patientRegistration: { label: 'Patient Registration', component: PatientRegistration },
  opdModule: { label: 'OPD Module', component: OPDModule },
  wardManagement: { label: 'Ward Management', component: WardManagement },
  icuModule: { label: 'ICU Module', component: ICUModule },
  otModule: { label: 'Operation Theater', component: OTModule },
  laboratoryModule: { label: 'Laboratory Module', component: LaboratoryModule },
  radiologyModule: { label: 'Radiology Module', component: RadiologyModule },
  pharmacyModule: { label: 'Pharmacy Module', component: PharmacyModule },
  maternityModule: { label: 'Maternity Module', component: MaternityModule },
  emergencyModule: { label: 'Emergency Module', component: EmergencyModule },
  doctorDashboard: { label: 'Doctor Dashboard', component: DoctorDashboard },
  patientDashboard: { label: 'Patient Dashboard', component: PatientDashboard },
  announcements: { label: 'Announcements', component: AnnouncementsManager },
};

function DashboardShell({ user, stats, announcements, onLogout }) {
  const [selectedModule, setSelectedModule] = useState(user.role_name === 'Patient' ? 'patientDashboard' : 'dashboardHome');

  const modules = useMemo(() => {
    if (user.role_name === 'Patient') {
      return ['patientDashboard', 'announcements'];
    }
    if (user.role_name === 'Doctor') {
      return ['doctorDashboard', 'patientRegistration', 'opdModule', 'wardManagement', 'icuModule', 'otModule', 'laboratoryModule', 'radiologyModule', 'pharmacyModule', 'emergencyModule', 'announcements'];
    }
    return ['dashboardHome', 'doctorManagement', 'patientRegistration', 'opdModule', 'wardManagement', 'icuModule', 'otModule', 'laboratoryModule', 'radiologyModule', 'pharmacyModule', 'maternityModule', 'emergencyModule', 'announcements'];
  }, [user.role_name]);

  const SelectedComponent = moduleMap[selectedModule]?.component || DashboardSummary;

  return (
    <Box component="main" sx={{ pb: 4, backgroundColor: '#eef4ff', minHeight: '100vh' }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, position: { md: 'sticky' }, top: 32, bgcolor: '#ffffff', boxShadow: '0 24px 55px rgba(15, 23, 42, 0.05)' }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>ISHIS Portal</Typography>
                <Typography color="text.secondary">Hospital management system</Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: '#f8fbff', borderColor: '#dbeafe' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>{user.full_name}</Typography>
                <Typography color="text.secondary">{user.role_name}</Typography>
                {user.role_name === 'Doctor' && user.doctor_id && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Doctor ID: <strong>{user.doctor_id}</strong>
                  </Typography>
                )}
              </Paper>

              <List disablePadding>
                {modules.map((key) => (
                  <ListItemButton
                    key={key}
                    selected={selectedModule === key}
                    onClick={() => setSelectedModule(key)}
                    sx={{
                      borderRadius: 3,
                      mb: 1,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(45, 106, 239, 0.12)',
                        color: '#1d4ed8',
                      },
                    }}
                  >
                    <ListItemText primary={moduleMap[key].label} />
                  </ListItemButton>
                ))}
              </List>

              <Button variant="outlined" color="secondary" onClick={onLogout} fullWidth>
                Logout
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, backgroundImage: 'linear-gradient(135deg, #eef4ff, #ffffff)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{moduleMap[selectedModule]?.label || 'Dashboard'}</Typography>
                  <Typography color="text.secondary">Use the menu to move between modules and manage patient care in one modern interface.</Typography>
                </Box>
                <Button variant="contained" color="secondary" onClick={onLogout} sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}>
                  Logout
                </Button>
              </Stack>
            </Paper>
            <SelectedComponent
              user={user}
              stats={stats}
              announcements={announcements}
              onRegisterPatient={() => setSelectedModule('patientRegistration')}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardShell;
