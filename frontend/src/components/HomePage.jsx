import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  ShieldAlert,
  HeartPulse,
  Users,
  TrendingUp,
  Volume2,
  Award,
  Calendar,
  LogIn,
  MapPin,
} from 'lucide-react';

import Footer from './Footer';

const themeColors = {
  primary: '#2563eb',
  secondary: '#ec4899',
  accent: '#7c3aed',
  danger: '#ef4444',
  lightBg: '#eef4ff',
  cardBg: '#ffffff',
  heroBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(236, 72, 153, 0.10))',
};

const emergencyContacts = [
  { label: 'Suwa Seriya Ambulance', value: '1990' },
  { label: 'Emergency Department', value: '+94 11 269 3111' },
  { label: 'ICU Hotline', value: 'Ext. 3209' },
  { label: 'Blood Bank', value: '+94 11 269 1513' },
  { label: 'Police Emergency', value: '119' },
  { label: 'Fire & Rescue', value: '110' },
];

const portalCards = [
  {
    title: 'Admin & Management Portal',
    description:
      'Registry control, clinic allocations, announcements, ICU and ward admissions, and hospital performance metrics.',
    label: 'System Control Access',
    icon: ShieldAlert,
    type: 'admin',
  },
  {
    title: 'Clinical Practitioner Portal',
    description:
      'OPD consultations, patient history review, appointment scheduling, and medical reporting workflows.',
    label: 'Clinical Access',
    icon: HeartPulse,
    type: 'doctor',
  },
  {
    title: 'Patient Health Hub',
    description:
      'NIC-based access to medical history, reports, prescriptions, clinic dates, and notifications.',
    label: 'Medical Records',
    icon: Users,
    type: 'patient',
  },
];

function HomePage({ onOpenLogin, announcements = [], stats = {} }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const normalizedStats = {
    doctorCount: stats.total_doctors ?? 0,
    staffCount: stats.total_staff ?? 0,
    availableBeds: stats.available_beds ?? 0,
    admittedPatients: stats.admitted_patients ?? 0,
    opdPatientsToday: stats.todays_opd ?? 0,
    icuOccupancyRate: stats.icu_occupancy_rate ?? 0,
  };

  
  return (
    <Box sx={{ bgcolor: themeColors.lightBg, minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg">

        {/* HEADER */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, mb: 4, backgroundImage: themeColors.heroBg, border: '1px solid rgba(37, 99, 235, 0.14)', backgroundColor: '#f1f7ff', boxShadow: '0 32px 80px rgba(37, 99, 235, 0.08)' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  <Chip label="Govt. of Sri Lanka" sx={{ bgcolor: themeColors.primary, color: '#fff' }} />
                  <Chip label="Ministry of Health" variant="outlined" />
                </Stack>

                <Typography variant="h4" fontWeight={800} color={themeColors.primary}>
                  NATIONAL HOSPITAL OF SRI LANKA
                </Typography>

                <Typography color="text.secondary">
                  Integrated Smart Hospital Information System (ISHIS) • Colombo
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={2}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#eff6ff', boxShadow: '0 18px 40px rgba(37, 99, 235, 0.10)' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MapPin size={18} />
                    <Typography fontWeight={600}>Colombo 08, Sri Lanka</Typography>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff0f6', boxShadow: '0 18px 40px rgba(236, 72, 153, 0.10)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Emergency Hotline
                  </Typography>
                  <Typography fontWeight={700}>1990 / +94 11 269 3111</Typography>

                  <Typography variant="body2" color="text.secondary" mt={2}>
                    System Time
                  </Typography>
                  <Typography fontWeight={700} fontFamily="monospace">
                    {time}
                  </Typography>
                </Paper>

                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: themeColors.secondary, '&:hover': { bgcolor: '#db2777' }, boxShadow: '0 14px 30px rgba(236, 72, 153, 0.24)' }}
                    onClick={() => onOpenLogin('login', 'patient')}
                  >
                    Patient Portal
                  </Button>

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: themeColors.primary, '&:hover': { bgcolor: '#1d4ed8' } }}
                    onClick={() => onOpenLogin('login', 'admin')}
                  >
                    Admin Access
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* PORTALS */}
        <Grid container spacing={3}>
          {portalCards.map((item) => {
            const Icon = item.icon;
            return (
              <Grid key={item.type} item xs={12} md={4}>
                <Card sx={{ borderRadius: 4, height: '100%', backgroundColor: '#f8fcff', boxShadow: '0 24px 48px rgba(37, 99, 235, 0.08)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 32px 64px rgba(37, 99, 235, 0.12)' } }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 2,
                          bgcolor: themeColors.primary,
                          color: '#fff',
                        }}
                      >
                        <Icon size={20} />
                      </Box>

                      <Typography fontWeight={700} variant="h6">
                        {item.title}
                      </Typography>

                      <Typography color="text.secondary">
                        {item.description}
                      </Typography>

                      <Typography fontSize={13} color={themeColors.secondary} fontWeight={600}>
                        {item.label}
                      </Typography>

                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: item.type === 'patient' ? themeColors.secondary : themeColors.primary,
                          color: '#fff',
                          '&:hover': { bgcolor: item.type === 'patient' ? '#db2777' : '#1d4ed8' },
                        }}
                        onClick={() => onOpenLogin('login', item.type)}
                      >
                        Open Portal
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* STATS */}
        <Paper sx={{ p: 4, borderRadius: 4, mt: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={700}>Hospital Live Stats</Typography>
            <TrendingUp color={themeColors.accent} />
          </Stack>

          <Grid container spacing={2} mt={2}>
            {[
              ['Doctors', normalizedStats.doctorCount],
              ['Staff', normalizedStats.staffCount],
              ['Beds', normalizedStats.availableBeds],
              ['Admitted', normalizedStats.admittedPatients],
              ['OPD Today', normalizedStats.opdPatientsToday],
              ['ICU %', normalizedStats.icuOccupancyRate + '%'],
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fbff', boxShadow: '0 12px 30px rgba(37, 99, 235, 0.08)' }}>
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography fontSize={28} fontWeight={800}>
                    {value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* EMERGENCY + ANNOUNCEMENTS */}
        <Grid container spacing={3} mt={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#ffffff', boxShadow: '0 24px 55px rgba(15, 23, 42, 0.05)' }}>
              <Typography fontWeight={700} mb={2}>
                Emergency Contacts
              </Typography>

              <Stack spacing={1}>
                {emergencyContacts.map((c) => (
                  <Paper key={c.label} sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>{c.label}</Typography>
                      <Typography fontWeight={700}>{c.value}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Volume2 />
                <Typography fontWeight={700}>Announcements</Typography>
              </Stack>

              {announcements.length === 0 ? (
                <Typography color="text.secondary">
                  No announcements available.
                </Typography>
              ) : (
                announcements.map((a) => (
                  <Paper key={a.announcement_id} sx={{ p: 3, mb: 2 }}>
                    <Typography fontWeight={700}>{a.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(a.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography mt={1}>{a.body}</Typography>
                  </Paper>
                ))
              )}

              <Paper sx={{ p: 3, mt: 2, borderRadius: 4, bgcolor: '#eef7ff' }}>
                <Stack spacing={2} alignItems="center">
                  <Typography fontWeight={700}>Patient Login</Typography>
                  <Typography color="text.secondary" textAlign="center">
                    If you are a patient, use the portal to access your medical record, prescriptions, and appointments.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ bgcolor: themeColors.secondary }}
                    onClick={() => onOpenLogin('login', 'patient')}
                  >
                    Go to Patient Login
                  </Button>
                </Stack>
              </Paper>
            </Paper>
          </Grid>
        </Grid>

        {/* MISSION */}
        <Grid container spacing={3} mt={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
              <Award />
              <Typography fontWeight={700} mt={1}>
                Mission
              </Typography>
              <Typography color="text.secondary">
                Deliver high-quality healthcare using modern technology and compassionate care.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
              <Calendar />
              <Typography fontWeight={700} mt={1}>
                Vision
              </Typography>
              <Typography color="text.secondary">
                Be Sri Lanka’s leading digital healthcare institution.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Footer />
      </Container>
    </Box>
  );
}

export default HomePage;