import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
} from '@mui/material';


import { ShieldCheck, User, Lock } from 'lucide-react';

const themeColors = {
  primary: '#2563eb',
  secondary: '#ec4899',
  bg: '#eef4ff',
  panelBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(236, 72, 153, 0.16))',
};

function LoginPage({ loginType, onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [patientId, setPatientId] = useState('');
  const [nic, setNic] = useState('');

  const submit = (event) => {
    event.preventDefault();

    if (loginType === 'patient') {
      onLogin({ patient_id: patientId, nic });
    } else {
      onLogin({ username, password });
    }
  };

  const title =
    loginType === 'patient'
      ? 'Patient Secure Access'
      : loginType === 'doctor'
      ? 'Doctor Clinical Portal'
      : 'Admin Control Panel';

  const subtitle =
    loginType === 'patient'
      ? 'Access your medical records and appointments securely'
      : loginType === 'doctor'
      ? 'Manage patients, OPD, and clinical workflows'
      : 'Hospital system administration and control access';

  const sampleCredentials = {
    admin: {
      label: 'Admin demo credentials',
      lines: ['Username: admin', 'Password: admin123'],
    },
    doctor: {
      label: 'Doctor demo credentials',
      lines: ['Username: drsaman', 'Password: doctor123'],
    },
    patient: {
      label: 'Patient demo credentials',
      lines: ['Patient ID: 1', 'NIC: patient123'],
    },
  };

  const sampleInfo = sampleCredentials[loginType] || sampleCredentials.admin;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: themeColors.bg,
        display: 'flex',
        alignItems: 'center',
        py: 6,
        backgroundImage: 'radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 32%), radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.12), transparent 28%)',
      }}
    >
      <Container maxWidth="md">
        <Grid container spacing={3}>

          {/* LEFT INFO PANEL */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                borderRadius: 4,
                height: '100%',
                bgcolor: themeColors.panelBg,
                color: '#0f172a',
                boxShadow: '0 24px 60px rgba(32, 97, 237, 0.08)',
              }}
            >
              <Stack spacing={2}>
                <ShieldCheck size={32} />

                <Typography variant="h5" fontWeight={800}>
                  {title}
                </Typography>

                <Typography sx={{ opacity: 0.9 }}>
                  {subtitle}
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Secure authentication &bull; ISHIS Hospital System
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* RIGHT FORM */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={6}
              sx={{
                p: 5,
                borderRadius: 4,
                bgcolor: '#fff',
              }}
            >
              <Stack spacing={1} mb={3}>
                <Typography variant="h4" fontWeight={800} color={themeColors.primary}>
                  Sign In
                </Typography>

                <Typography color="text.secondary">
                  Enter your credentials to continue
                </Typography>
              </Stack>

              <Box component="form" onSubmit={submit}>
                <Stack spacing={3}>

                  {loginType === 'patient' ? (
                    <>
                      <TextField
                        label="Patient ID"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        fullWidth
                        required
                      />

                      <TextField
                        label="NIC Number"
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        fullWidth
                        required
                      />
                    </>
                  ) : (
                    <>
                      <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: <User size={18} style={{ marginRight: 8 }} />,
                        }}
                      />

                      <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: <Lock size={18} style={{ marginRight: 8 }} />,
                        }}
                      />
                      {loginType === 'doctor' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Doctor ID is retrieved automatically once you login.
                        </Typography>
                      )}
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: themeColors.secondary,
                      fontWeight: 700,
                      py: 1.2,
                      '&:hover': {
                        bgcolor: '#dc1f74',
                      },
                    }}
                  >
                    Login Securely
                  </Button>

                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      {sampleInfo.label}
                    </Typography>
                    {sampleInfo.lines.map((line) => (
                      <Typography key={line} variant="body2" color="text.secondary">
                        {line}
                      </Typography>
                    ))}
                  </Paper>

                  <Button
                    variant="outlined"
                    onClick={onBack}
                    fullWidth
                  >
                    Back to Home
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default LoginPage;