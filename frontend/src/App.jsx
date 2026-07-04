import { useEffect, useState } from 'react';
import axios from 'axios';
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from '@mui/material';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import DashboardShell from './components/DashboardShell';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/HICT-22013-Hospital-Management-System/backend/api.php';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', contrastText: '#ffffff' },
    secondary: { main: '#ec4899', contrastText: '#ffffff' },
    info: { main: '#7c3aed', contrastText: '#ffffff' },
    success: { main: '#22c55e', contrastText: '#ffffff' },
    warning: { main: '#f59e0b', contrastText: '#ffffff' },
    background: { default: '#eef4ff', paper: '#ffffff' },
    text: { primary: '#102a43', secondary: '#475569' },
  },
  shape: { borderRadius: 24 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [loginType, setLoginType] = useState('admin');
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}?action=announcements`).then((res) => setAnnouncements(res.data.announcements || []));
    axios.get(`${API_BASE}?action=stats`).then((res) => setStats(res.data.stats || {}));
  }, []);

  const handleLogin = async (payload) => {
    try {
      const response = await axios.post(`${API_BASE}?action=login`, payload);
      const { user: userData, token } = response.data;
      setUser(userData);

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setCurrentPage('dashboard');
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setCurrentPage('home');
  };

  const handleNavigate = (page, type = 'admin') => {
    setLoginType(type);
    setCurrentPage(page);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {currentPage === 'home' && (
            <HomePage
              onOpenLogin={handleNavigate}
              announcements={announcements}
              stats={stats}
            />
          )}
          {currentPage === 'login' && (
            <LoginPage loginType={loginType} onLogin={handleLogin} onBack={() => setCurrentPage('home')} />
          )}
          {currentPage === 'dashboard' && user && (
            <DashboardShell user={user} stats={stats} announcements={announcements} onLogout={handleLogout} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
