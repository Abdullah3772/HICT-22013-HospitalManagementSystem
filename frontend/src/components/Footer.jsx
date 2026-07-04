import { Box, Container, Grid, Paper, Stack, Typography, Link } from '@mui/material';


function Footer() {
  return (
    <Box component="footer" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{
        p: 4,
        borderRadius: 4,
        backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #ec4899 100%)',
        color: 'common.white',
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>About Hospital</Typography>
              <Typography>National Hospital Colombo is a public health center delivering modern, compassionate care.</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Contact Info</Typography>
              <Typography>Mail: contact@nationalhospital.lk</Typography>
              <Typography>Phone: 011 234 5678</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Quick Links</Typography>
              <Stack spacing={0.5}>
                <Link href="#" color="common.white" underline="hover">Admin Login</Link>
                <Link href="#" color="common.white" underline="hover">Doctor Login</Link>
                <Link href="#" color="common.white" underline="hover">Patient Login</Link>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Policies</Typography>
              <Typography>Privacy Policy</Typography>
              <Typography>Terms & Conditions</Typography>
              <Typography>Copyright © 2026</Typography>
            </Grid>
          </Grid>
        </Container>
      </Paper>
    </Box>
  );
}

export default Footer;
