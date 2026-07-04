import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/HICT-22013-HospitalManagementSystem/backend/api.php';

const formatLabel = (field) => field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const SectionCard = ({ title, children }) => (
  <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
    {children}
  </Paper>
);

const FormField = ({ label, children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
    <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    {children}
  </Box>
);

const PatientLookupPanel = ({ patientId, onPatientIdChange, onSearchPatient, patient, history, section, onSectionChange, loading, error, onRegisterPatient }) => {
  const sections = [
    { value: 'all', label: 'Overview' },
    { value: 'consultations', label: 'Consultations' },
    { value: 'prescriptions', label: 'Prescriptions' },
    { value: 'lab_tests', label: 'Lab Tests' },
    { value: 'radiology_tests', label: 'Radiology' },
    { value: 'ward_admissions', label: 'Ward Admissions' },
    { value: 'icu_records', label: 'ICU Records' },
  ];

  const sectionLabel = sections.find((item) => item.value === section)?.label || 'Overview';
  const items = section === 'all' ? [] : history?.[section] ?? [];

  const renderHistoryText = (item) => {
    const keys = [
      'chief_complaint','current_illness','symptoms','diagnosis','severity',
      'medicine_name','dosage','frequency','duration','instructions',
      'test_type','status','result','result_date',
      'imaging_type','findings','notes','report_file',
      'ward_number','admission_date','discharge_date','clinic_date',
      'blood_pressure','heart_rate','oxygen_saturation','temperature','respiratory_rate','ventilator_status',
      'created_at','recorded_at','surgery_date',
    ];
    return Object.entries(item)
      .filter(([key, value]) => keys.includes(key) && value !== null && value !== undefined && value !== '')
      .slice(0, 4)
      .map(([key, value]) => `${formatLabel(key)}: ${value}`)
      .join(' • ');
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField
            label="Patient ID"
            value={patientId}
            onChange={(e) => onPatientIdChange(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            onClick={onSearchPatient}
            disabled={!patientId || loading}
            fullWidth
            sx={{ height: '100%' }}
          >
            {loading ? 'Searching...' : 'Lookup Patient'}
          </Button>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

        {patient ? (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Patient Summary</Typography>
              <Typography sx={{ fontWeight: 700 }}>{patient.full_name}</Typography>
              <Typography color="text.secondary">Patient ID: {patient.patient_id}</Typography>
              <Typography color="text.secondary">NIC: {patient.nic} • {patient.gender} • {patient.age} years</Typography>
              <Typography color="text.secondary">Contact: {patient.contact_number} • {patient.email}</Typography>
              <Typography color="text.secondary">Address: {patient.address}</Typography>
              <Typography color="text.secondary">Blood Group: {patient.blood_group} • Allergies: {patient.allergies || 'None'}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Select value={section} onChange={(e) => onSectionChange(e.target.value)}>
                  {sections.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {section === 'all' ? (
              <Grid item xs={12}>
                <Stack direction="row" flexWrap="wrap" spacing={2}>
                  {[
                    { label: 'Consultations', value: history?.consultations?.length ?? 0 },
                    { label: 'Prescriptions', value: history?.prescriptions?.length ?? 0 },
                    { label: 'Lab Tests', value: history?.lab_tests?.length ?? 0 },
                    { label: 'Radiology', value: history?.radiology_tests?.length ?? 0 },
                    { label: 'Ward Admissions', value: history?.ward_admissions?.length ?? 0 },
                    { label: 'ICU Records', value: history?.icu_records?.length ?? 0 },
                  ].map((item) => (
                    <Paper key={item.label} sx={{ p: 2, borderRadius: 3, minWidth: 120 }}>
                      <Typography variant="subtitle2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{sectionLabel}</Typography>
                  {items.length ? (
                    <Stack spacing={2}>
                      {items.map((item, index) => (
                        <Paper key={index} sx={{ p: 2, borderRadius: 3 }}>
                          <Typography sx={{ fontWeight: 700 }}>{renderHistoryText(item) || 'Record'}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No records found for this category.</Typography>
                  )}
                </Paper>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => onRegisterPatient ? onRegisterPatient() : alert('Open the Patient Registration module from the sidebar to add a new patient.')}
              >
                Register New Patient
              </Button>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Typography color="text.secondary">Enter a valid Patient ID and press lookup to load history, details, and filters.</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export function DashboardSummary({ user, stats, announcements }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Welcome, {user.full_name}</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>Role: {user.role_name}</Typography>

      <SectionCard title="Summary">
        <Grid container spacing={2}>
          {[
            { label: 'Total Doctors', value: stats.total_doctors ?? 0 },
            { label: 'Total Staff', value: stats.total_staff ?? 0 },
            { label: 'Available Beds', value: stats.available_beds ?? 0 },
            { label: 'Admitted Patients', value: stats.admitted_patients ?? 0 },
            { label: "Today's OPD", value: stats.todays_opd ?? 0 },
            { label: 'ICU Occupancy', value: `${stats.icu_occupancy_rate ?? 0}%` },
          ].map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, minHeight: 120 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{item.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{item.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionCard>

      <SectionCard title="Announcements">
        <Stack spacing={2}>
          {announcements.length > 0 ? announcements.map((announcement) => (
            <Paper key={announcement.announcement_id} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{announcement.title}</Typography>
              <Typography color="text.secondary">{announcement.body}</Typography>
            </Paper>
          )) : <Typography color="text.secondary">No announcements yet.</Typography>}
        </Stack>
      </SectionCard>
    </Box>
  );
}

const FullWidthField = ({ field, value, onChange, multiline, type = 'text' }) => (
  <Grid item xs={12} md={6}>
    <FormField label={formatLabel(field)}>
      <TextField
        fullWidth
        multiline={multiline}
        minRows={multiline ? 3 : 1}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={type === 'datetime-local' || type === 'date' ? { shrink: true } : undefined}
      />
    </FormField>
  </Grid>
);

const genericModule = ({ title, fields, endpoint, initial }) => {
  const [form, setForm] = useState(initial);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}?action=${endpoint}`, form);
      alert(`${title} saved`);
      setForm(initial);
    } catch (error) {
      alert(error.response?.data?.error || `Unable to save ${title.toLowerCase()}`);
    }
  };

  return (
    <Box>
      <SectionCard title={title}>
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.name}>
                <FormField label={formatLabel(field.name)}>
                  {field.type === 'select' ? (
                    <FormControl fullWidth>
                      <Select value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                        {field.options?.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      multiline={field.type === 'textarea'}
                      minRows={field.type === 'textarea' ? 3 : 1}
                      type={field.type === 'datetime' ? 'datetime-local' : field.type === 'date' ? 'date' : field.type}
                      InputLabelProps={field.type === 'datetime' || field.type === 'date' ? { shrink: true } : undefined}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      required={field.required ?? true}
                    />
                  )}
                </FormField>
              </Grid>
            ))}
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>{title}</Button>
        </Box>
      </SectionCard>
    </Box>
  );
};

export function DoctorManagement() {
  const initialForm = { doctor_id: '', username: '', password: '', full_name: '', nic: '', gender: 'Male', specialization: '', department: '', contact_number: '', email: '', qualifications: '', medical_registration_number: '' };
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingDoctor, setEditingDoctor] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}?action=listDoctors`).then((res) => setDoctors(res.data.doctors || []));
  }, []);

  const resetForm = (doctorId = '') => {
    setForm({ ...initialForm, doctor_id: doctorId });
    setEditingDoctor(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingDoctor) {
        await axios.post(`${API_BASE}?action=updateDoctor`, form);
        alert('Doctor updated.');
        resetForm();
      } else {
        const response = await axios.post(`${API_BASE}?action=createDoctor`, form);
        const newDoctorId = response.data.doctor_id || '';
        alert('Doctor created.');
        resetForm(newDoctorId);
      }

      const res = await axios.get(`${API_BASE}?action=listDoctors`);
      setDoctors(res.data.doctors || []);
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to save doctor details');
    }
  };

  return (
    <Box>
      <SectionCard title="Doctor Management">
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {['doctor_id','username','password','full_name','nic','gender','specialization','department','contact_number','email','qualifications','medical_registration_number'].map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <FormField label={formatLabel(field)}>
                  {field === 'gender' ? (
                    <FormControl fullWidth>
                      <Select value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      value={form[field]}
                      type={field === 'password' ? 'password' : 'text'}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      required={field !== 'email' && field !== 'doctor_id'}
                      InputProps={field === 'doctor_id' ? { readOnly: true } : undefined}
                      helperText={
                        field === 'doctor_id'
                          ? 'Doctor ID will be assigned automatically when the doctor is created.'
                          : field === 'password' && editingDoctor
                          ? 'Leave blank to keep the current password.'
                          : undefined
                      }
                    />
                  )}
                </FormField>
              </Grid>
            ))}
          </Grid>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">{editingDoctor ? 'Update Doctor' : 'Create Doctor'}</Button>
            {editingDoctor && (
              <Button type="button" variant="outlined" onClick={() => resetForm('')}>Cancel Edit</Button>
            )}
          </Stack>
        </Box>
      </SectionCard>

      <SectionCard title="Doctor List">
        <Grid container spacing={2}>
          {doctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor.doctor_id}>
              <Paper sx={{ p: 3, borderRadius: 3, minHeight: 210, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Dr. {doctor.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Doctor ID: {doctor.doctor_id}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{doctor.specialization || 'General Medicine'} / {doctor.department || 'Internal Medicine'}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    {doctor.contact_number || 'No contact'} • {doctor.email || 'No email'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" variant="outlined" onClick={() => {
                    setForm({
                      doctor_id: doctor.doctor_id,
                      username: doctor.username || '',
                      password: '',
                      full_name: doctor.full_name || '',
                      nic: doctor.nic || '',
                      gender: doctor.gender || 'Male',
                      specialization: doctor.specialization || '',
                      department: doctor.department || '',
                      contact_number: doctor.contact_number || '',
                      email: doctor.email || '',
                      qualifications: doctor.qualifications || '',
                      medical_registration_number: doctor.medical_registration_number || ''
                    });
                    setEditingDoctor(true);
                  }}>
                    Edit
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionCard>
    </Box>
  );
}

export function PatientRegistration() {
  const [form, setForm] = useState({ patient_id: '', full_name: '', nic: '', dob: '', age: '', gender: 'Male', address: '', contact_number: '', email: '', emergency_contact_person: '', emergency_contact_number: '', blood_group: '', allergies: '', existing_diseases: '', guardian_info: '', insurance_info: '' });
  const [duplicate, setDuplicate] = useState(null);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_BASE}?action=listPatients`);
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Failed to load patients', error);
    }
  };

  const fetchNextPatientId = async () => {
    try {
      const response = await axios.get(`${API_BASE}?action=nextPatientId`);
      setForm((prevForm) => ({ ...prevForm, patient_id: response.data.next_patient_id || '' }));
    } catch (error) {
      console.error('Failed to get next patient ID', error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchNextPatientId();
  }, []);

  const checkDuplicate = async () => {
    if (!form.nic && !form.contact_number) return;
    setDuplicate(null);
    try {
      if (form.nic) {
        const response = await axios.get(`${API_BASE}?action=patientByNIC&nic=${encodeURIComponent(form.nic)}`);
        if (response.data.patient) {
          setDuplicate({ nic: response.data.patient });
          populateForm(response.data.patient);
          return;
        }
      }
      if (form.contact_number) {
        const response = await axios.get(`${API_BASE}?action=patientByContact&contact_number=${encodeURIComponent(form.contact_number)}`);
        if (response.data.patient) {
          setDuplicate({ contact_number: response.data.patient });
          populateForm(response.data.patient);
          return;
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(error);
      }
    }
  };

  const populateForm = (patient) => {
    setForm({
      patient_id: patient.patient_id || '',
      full_name: patient.full_name || '',
      nic: patient.nic || '',
      dob: patient.dob || '',
      age: patient.age || '',
      gender: patient.gender || 'Male',
      address: patient.address || '',
      contact_number: patient.contact_number || '',
      email: patient.email || '',
      emergency_contact_person: patient.emergency_contact_person || '',
      emergency_contact_number: patient.emergency_contact_number || '',
      blood_group: patient.blood_group || '',
      allergies: patient.allergies || '',
      existing_diseases: patient.existing_diseases || '',
      guardian_info: patient.guardian_info || '',
      insurance_info: patient.insurance_info || '',
    });
    setSelectedPatient(patient);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}?action=registerPatient`, form);
      const newPatientId = response.data.patient_id;
      const savedPatient = { patient_id: newPatientId, ...form };
      setRegisteredPatient(savedPatient);
      setSelectedPatient(savedPatient);
      setForm({ ...savedPatient });
      alert(`Patient saved: ${newPatientId}`);
      setDuplicate(null);
      fetchPatients();
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      patient.patient_id?.toString(),
      patient.full_name,
      patient.nic,
      patient.contact_number,
      patient.email,
    ].some((field) => field?.toString().toLowerCase().includes(query));
  });

  return (
    <Box>
      <SectionCard title="Patient Registration">
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {['patient_id','full_name','nic','dob','age','gender','address','contact_number','email','emergency_contact_person','emergency_contact_number','blood_group','allergies','existing_diseases','guardian_info','insurance_info'].map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <FormField label={formatLabel(field)}>
                  {field === 'gender' ? (
                    <FormControl fullWidth>
                      <Select value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      value={form[field]}
                      type={field === 'dob' ? 'date' : field === 'age' ? 'number' : 'text'}
                      InputLabelProps={field === 'dob' ? { shrink: true } : undefined}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      required={field !== 'email' && field !== 'patient_id'}
                      InputProps={field === 'patient_id' ? { readOnly: true } : undefined}
                      helperText={
                        field === 'patient_id'
                          ? (form.patient_id ? 'Auto-generated next patient ID from the database.' : 'Patient ID will be assigned automatically.')
                          : field === 'nic'
                          ? 'Enter NIC and leave field to auto-fill if patient exists.'
                          : field === 'contact_number'
                          ? 'Enter contact number and leave field to auto-fill if patient exists.'
                          : undefined
                      }
                      onBlur={field === 'nic' || field === 'contact_number' ? checkDuplicate : undefined}
                    />
                  )}
                </FormField>
              </Grid>
            ))}
          </Grid>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">Register Patient</Button>
            {form.patient_id && (
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setForm({ patient_id: '', full_name: '', nic: '', dob: '', age: '', gender: 'Male', address: '', contact_number: '', email: '', emergency_contact_person: '', emergency_contact_number: '', blood_group: '', allergies: '', existing_diseases: '', guardian_info: '', insurance_info: '' });
                  setSelectedPatient(null);
                  setRegisteredPatient(null);
                  setDuplicate(null);
                  fetchNextPatientId();
                }}
              >
                New Patient
              </Button>
            )}
          </Stack>
        </Box>

        {registeredPatient && (
          <Paper sx={{ mt: 3, p: 3, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Patient Registered</Typography>
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'primary.light' }}>
              <Typography variant="subtitle2" color="text.secondary">Patient ID</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{registeredPatient.patient_id}</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.full_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">NIC</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.nic}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.gender}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">DOB</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.dob}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.age}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Blood Group</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.blood_group || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.contact_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Emergency Contact</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.emergency_contact_person || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Emergency Phone</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.emergency_contact_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.allergies || 'None'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Existing Diseases</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.existing_diseases || 'None'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Guardian Info</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.guardian_info || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Insurance</Typography>
                <Typography sx={{ fontWeight: 700 }}>{registeredPatient.insurance_info || 'N/A'}</Typography>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary" onClick={() => window.print()}>
                Print Patient ID Card
              </Button>
            </Stack>
            <Typography sx={{ mt: 2 }} color="text.secondary">Use this ID in OPD, ward, ICU, and other patient workflows.</Typography>
          </Paper>
        )}

        {duplicate && (
          <Paper sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Duplicate warning</Typography>
            {duplicate.nic && <Typography color="text.secondary">Existing NIC: {duplicate.nic.full_name} (ID {duplicate.nic.patient_id})</Typography>}
            {duplicate.contact_number && <Typography color="text.secondary">Existing Contact: {duplicate.contact_number.full_name} (ID {duplicate.contact_number.patient_id})</Typography>}
          </Paper>
        )}
      </SectionCard>

      <SectionCard title="Search Existing Patients">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              label="Search patients by ID, name, NIC, contact or email"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" onClick={() => setSearchTerm('')} fullWidth>Clear Search</Button>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {filteredPatients.length ? (
            filteredPatients.slice(0, 12).map((patient) => (
              <Grid item xs={12} sm={6} md={4} key={patient.patient_id}>
                <Paper
                  elevation={1}
                  sx={{ p: 2, borderRadius: 3, cursor: 'pointer' }}
                  onClick={() => populateForm(patient)}
                >
                  <Typography variant="subtitle2" color="text.secondary">ID: {patient.patient_id}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{patient.full_name}</Typography>
                  <Typography color="text.secondary">NIC: {patient.nic}</Typography>
                  <Typography color="text.secondary">Contact: {patient.contact_number || 'No contact'}</Typography>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary">No patients found for this search.</Typography>
            </Grid>
          )}
        </Grid>

        {selectedPatient && (
          <Paper sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Selected Patient Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Patient ID</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.patient_id}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.full_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">NIC</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.nic}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.gender}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">DOB</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.dob}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.age}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.contact_number || 'N/A'}{selectedPatient.email ? ` • ${selectedPatient.email}` : ''}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Emergency Contact</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.emergency_contact_person || 'N/A'}{selectedPatient.emergency_contact_number ? ` • ${selectedPatient.emergency_contact_number}` : ''}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Blood Group</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.blood_group || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                <Typography sx={{ fontWeight: 700 }}>{selectedPatient.allergies || 'None'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </SectionCard>
    </Box>
  );
}

export function OPDModule({ user, onRegisterPatient }) {
  const initial = {
    patient_id: '',
    doctor_id: user?.doctor_id || '',
    chief_complaint: '',
    current_illness: '',
    symptoms: '',
    diagnosis: '',
    severity: 'Moderate',
    prescriptions: [
      { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  };
  const [form, setForm] = useState(initial);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientError, setPatientError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [historySection, setHistorySection] = useState('all');
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    if (user?.doctor_id && !form.doctor_id) {
      setForm((prevForm) => ({ ...prevForm, doctor_id: user.doctor_id }));
    }
  }, [user?.doctor_id]);

  const loadPatientData = async (id) => {
    if (!id) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('');
      return;
    }
    setLoadingPatient(true);
    try {
      const [patientRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}?action=patientById&patient_id=${encodeURIComponent(id)}`),
        axios.get(`${API_BASE}?action=patientHistory&patient_id=${encodeURIComponent(id)}`),
      ]);
      setPatientDetails(patientRes.data.patient || null);
      setPatientHistory(historyRes.data || null);
      setPatientError('');
    } catch (error) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('Patient not found or invalid ID');
    } finally {
      setLoadingPatient(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}?action=opdConsultation`, form);
      alert('OPD consultation saved successfully');
      setForm(initial);
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientId('');
      setHistorySection('all');
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to save OPD consultation');
    }
  };

  const updatePrescriptionField = (index, field, value) => {
    setForm((prevForm) => {
      const prescriptions = [...prevForm.prescriptions];
      prescriptions[index] = { ...prescriptions[index], [field]: value };
      return { ...prevForm, prescriptions };
    });
  };

  const addPrescriptionRow = () => {
    setForm((prevForm) => ({
      ...prevForm,
      prescriptions: [...prevForm.prescriptions, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removePrescriptionRow = (index) => {
    setForm((prevForm) => ({
      ...prevForm,
      prescriptions: prevForm.prescriptions.filter((_, i) => i !== index)
    }));
  };

  return (
    <Box>
      <SectionCard title="OPD Module">
        <PatientLookupPanel
          patientId={patientId}
          onPatientIdChange={(value) => {
            setPatientId(value);
            setForm({ ...form, patient_id: value });
          }}
          onSearchPatient={() => loadPatientData(patientId)}
          patient={patientDetails}
          history={patientHistory}
          section={historySection}
          onSectionChange={setHistorySection}
          loading={loadingPatient}
          error={patientError}
          onRegisterPatient={onRegisterPatient}
        />

        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {[
              { name: 'doctor_id', type: 'text' },
              { name: 'chief_complaint', type: 'textarea', required: false },
              { name: 'current_illness', type: 'textarea', required: false },
              { name: 'symptoms', type: 'textarea', required: false },
              { name: 'diagnosis', type: 'textarea', required: false },
              { name: 'severity', type: 'select', options: ['Mild', 'Moderate', 'Severe', 'Critical'] },
            ].map((field) => {
              const isDoctorIdField = field.name === 'doctor_id';
              const readOnlyDoctorId = isDoctorIdField && !!user?.doctor_id;
              return (
                <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.name}>
                  <FormField label={formatLabel(field.name)}>
                    {field.type === 'select' ? (
                      <FormControl fullWidth>
                        <Select value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                          {field.options?.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        multiline={field.type === 'textarea'}
                        minRows={field.type === 'textarea' ? 3 : 1}
                        type={field.type === 'datetime' ? 'datetime-local' : field.type === 'date' ? 'date' : field.type}
                        InputLabelProps={field.type === 'datetime' || field.type === 'date' ? { shrink: true } : undefined}
                        value={form[field.name]}
                        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        InputProps={readOnlyDoctorId ? { readOnly: true } : undefined}
                        helperText={readOnlyDoctorId ? 'Auto-filled from your logged-in doctor account' : undefined}
                        required={field.required ?? true}
                      />
                    )}
                  </FormField>
                </Grid>
              );
            })}
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>Prescription / Pharmacy Details</Typography>
          {form.prescriptions.map((prescription, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                  <FormField label="Medicine Name">
                    <TextField
                      fullWidth
                      value={prescription.medicine_name}
                      onChange={(e) => updatePrescriptionField(index, 'medicine_name', e.target.value)}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormField label="Dosage">
                    <TextField
                      fullWidth
                      value={prescription.dosage}
                      onChange={(e) => updatePrescriptionField(index, 'dosage', e.target.value)}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormField label="Frequency">
                    <TextField
                      fullWidth
                      value={prescription.frequency}
                      onChange={(e) => updatePrescriptionField(index, 'frequency', e.target.value)}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormField label="Duration">
                    <TextField
                      fullWidth
                      value={prescription.duration}
                      onChange={(e) => updatePrescriptionField(index, 'duration', e.target.value)}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={12} md={7}>
                  <FormField label="Instructions">
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={prescription.instructions}
                      onChange={(e) => updatePrescriptionField(index, 'instructions', e.target.value)}
                    />
                  </FormField>
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 1 }}
                    onClick={() => removePrescriptionRow(index)}
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button variant="outlined" onClick={addPrescriptionRow} sx={{ mb: 3 }}>Add Medicine</Button>

          <Button type="submit" variant="contained" sx={{ mt: 3 }}>Save Consultation</Button>
        </Box>
      </SectionCard>
    </Box>
  );
}

export function WardManagement({ user, onRegisterPatient }) {
  const initial = { patient_id: '', ward_number: '', doctor_id: user?.doctor_id || '', diagnosis: '', admission_date: '', discharge_date: '', discharge_summary: '', follow_up_instructions: '', clinic_date: '' };
  const [form, setForm] = useState(initial);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientError, setPatientError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [historySection, setHistorySection] = useState('all');
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    if (user?.doctor_id && !form.doctor_id) {
      setForm((prevForm) => ({ ...prevForm, doctor_id: user.doctor_id }));
    }
  }, [user?.doctor_id]);

  const loadPatientData = async (id) => {
    if (!id) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('');
      return;
    }
    setLoadingPatient(true);
    try {
      const [patientRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}?action=patientById&patient_id=${encodeURIComponent(id)}`),
        axios.get(`${API_BASE}?action=patientHistory&patient_id=${encodeURIComponent(id)}`),
      ]);
      setPatientDetails(patientRes.data.patient || null);
      setPatientHistory(historyRes.data || null);
      setPatientError('');
    } catch (error) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('Patient not found or invalid ID');
    } finally {
      setLoadingPatient(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}?action=wardAdmission`, form);
      alert('Ward admission recorded successfully');
      setForm(initial);
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientId('');
      setHistorySection('all');
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to record ward admission');
    }
  };

  return (
    <Box>
      <SectionCard title="Ward Management">
        <PatientLookupPanel
          patientId={patientId}
          onPatientIdChange={(value) => {
            setPatientId(value);
            setForm({ ...form, patient_id: value });
          }}
          onSearchPatient={() => loadPatientData(patientId)}
          patient={patientDetails}
          history={patientHistory}
          section={historySection}
          onSectionChange={setHistorySection}
          loading={loadingPatient}
          error={patientError}
          onRegisterPatient={onRegisterPatient}
        />

        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {[
              { name: 'patient_id', type: 'text' },
              { name: 'ward_number', type: 'text' },
              { name: 'doctor_id', type: 'text', required: false },
              { name: 'diagnosis', type: 'textarea', required: false },
              { name: 'admission_date', type: 'datetime', required: false },
              { name: 'discharge_date', type: 'datetime', required: false },
              { name: 'discharge_summary', type: 'textarea', required: false },
              { name: 'follow_up_instructions', type: 'textarea', required: false },
              { name: 'clinic_date', type: 'date', required: false },
            ].map((field) => {
              const isDoctorIdField = field.name === 'doctor_id';
              const readOnlyDoctorId = isDoctorIdField && !!user?.doctor_id;
              return (
                <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.name}>
                  <FormField label={formatLabel(field.name)}>
                    <TextField
                      fullWidth
                      multiline={field.type === 'textarea'}
                      minRows={field.type === 'textarea' ? 3 : 1}
                      type={field.type === 'datetime' ? 'datetime-local' : field.type === 'date' ? 'date' : field.type}
                      InputLabelProps={field.type === 'datetime' || field.type === 'date' ? { shrink: true } : undefined}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      InputProps={readOnlyDoctorId ? { readOnly: true } : undefined}
                      helperText={readOnlyDoctorId ? 'Auto-filled from your logged-in doctor account' : undefined}
                      required={field.required ?? true}
                    />
                  </FormField>
                </Grid>
              );
            })}
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>Record Admission</Button>
        </Box>
      </SectionCard>
    </Box>
  );
}

export function ICUModule({ user, onRegisterPatient }) {
  const initial = { patient_id: '', doctor_id: user?.doctor_id || '', blood_pressure: '', heart_rate: '', oxygen_saturation: '', temperature: '', respiratory_rate: '', ventilator_status: '', medications: '', procedures: '', doctor_notes: '' };
  const [form, setForm] = useState(initial);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientError, setPatientError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [historySection, setHistorySection] = useState('all');
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    if (user?.doctor_id && !form.doctor_id) {
      setForm((prevForm) => ({ ...prevForm, doctor_id: user.doctor_id }));
    }
  }, [user?.doctor_id]);

  const loadPatientData = async (id) => {
    if (!id) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('');
      return;
    }
    setLoadingPatient(true);
    try {
      const [patientRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}?action=patientById&patient_id=${encodeURIComponent(id)}`),
        axios.get(`${API_BASE}?action=patientHistory&patient_id=${encodeURIComponent(id)}`),
      ]);
      setPatientDetails(patientRes.data.patient || null);
      setPatientHistory(historyRes.data || null);
      setPatientError('');
    } catch (error) {
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientError('Patient not found or invalid ID');
    } finally {
      setLoadingPatient(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}?action=icuRecord`, form);
      alert('ICU record saved successfully');
      setForm(initial);
      setPatientDetails(null);
      setPatientHistory(null);
      setPatientId('');
      setHistorySection('all');
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to save ICU record');
    }
  };

  return (
    <Box>
      <SectionCard title="ICU Module">
        <PatientLookupPanel
          patientId={patientId}
          onPatientIdChange={(value) => {
            setPatientId(value);
            setForm({ ...form, patient_id: value });
          }}
          onSearchPatient={() => loadPatientData(patientId)}
          patient={patientDetails}
          history={patientHistory}
          section={historySection}
          onSectionChange={setHistorySection}
          loading={loadingPatient}
          error={patientError}
          onRegisterPatient={onRegisterPatient}
        />

        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            {[
              { name: 'patient_id', type: 'text' },
              { name: 'doctor_id', type: 'text' },
              { name: 'blood_pressure', type: 'text' },
              { name: 'heart_rate', type: 'text' },
              { name: 'oxygen_saturation', type: 'text' },
              { name: 'temperature', type: 'text' },
              { name: 'respiratory_rate', type: 'text' },
              { name: 'ventilator_status', type: 'text', required: false },
              { name: 'medications', type: 'textarea', required: false },
              { name: 'procedures', type: 'textarea', required: false },
              { name: 'doctor_notes', type: 'textarea', required: false },
            ].map((field) => {
              const isDoctorIdField = field.name === 'doctor_id';
              const readOnlyDoctorId = isDoctorIdField && !!user?.doctor_id;
              return (
                <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.name}>
                  <FormField label={formatLabel(field.name)}>
                    <TextField
                      fullWidth
                      multiline={field.type === 'textarea'}
                      minRows={field.type === 'textarea' ? 3 : 1}
                      type={field.type === 'datetime' ? 'datetime-local' : field.type === 'date' ? 'date' : field.type}
                      InputLabelProps={field.type === 'datetime' || field.type === 'date' ? { shrink: true } : undefined}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      InputProps={readOnlyDoctorId ? { readOnly: true } : undefined}
                      helperText={readOnlyDoctorId ? 'Auto-filled from your logged-in doctor account' : undefined}
                      required={field.required ?? true}
                    />
                  </FormField>
                </Grid>
              );
            })}
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>Save ICU Record</Button>
        </Box>
      </SectionCard>
    </Box>
  );
}

export function OTModule() {
  const initial = { patient_id: '', surgeon_id: '', anesthetist_name: '', surgery_date: '', surgery_type: '', ot_room_number: '', outcome: '', recovery_notes: '', complications: '', recommendations: '', follow_up_instructions: '' };
  return genericModule({
    title: 'Operation Theater',
    endpoint: 'otSurgery',
    initial,
    fields: [
      { name: 'patient_id', type: 'text' },
      { name: 'surgeon_id', type: 'text' },
      { name: 'anesthetist_name', type: 'text' },
      { name: 'surgery_date', type: 'datetime', required: false },
      { name: 'surgery_type', type: 'text' },
      { name: 'ot_room_number', type: 'text' },
      { name: 'outcome', type: 'text', required: false },
      { name: 'recovery_notes', type: 'textarea', required: false },
      { name: 'complications', type: 'textarea', required: false },
      { name: 'recommendations', type: 'textarea', required: false },
      { name: 'follow_up_instructions', type: 'textarea', required: false },
    ],
  });
}

export function LaboratoryModule() {
  const initial = { patient_id: '', requested_by: '', test_type: '', sample_type: '' };
  return genericModule({
    title: 'Laboratory Module',
    endpoint: 'labRequest',
    initial,
    fields: [
      { name: 'patient_id', type: 'text' },
      { name: 'requested_by', type: 'text' },
      { name: 'test_type', type: 'text' },
      { name: 'sample_type', type: 'text' },
    ],
  });
}

export function RadiologyModule() {
  const initial = { patient_id: '', requested_by: '', imaging_type: '' };
  return genericModule({
    title: 'Radiology Module',
    endpoint: 'radiologyRequest',
    initial,
    fields: [
      { name: 'patient_id', type: 'text' },
      { name: 'requested_by', type: 'text' },
      { name: 'imaging_type', type: 'text' },
    ],
  });
}

export function PharmacyModule() {
  const [medicines, setMedicines] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientError, setPatientError] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [dispense, setDispense] = useState({ patient_id: '', prescribed_by: '', medicine_id: '', dosage: '', quantity: '', duration: '', instructions: '' });

  useEffect(() => {
    axios.get(`${API_BASE}?action=medicines`).then((res) => setMedicines(res.data.medicines || []));
  }, []);

  const loadPatientData = async () => {
    if (!patientId) {
      setPatientDetails(null);
      setPatientError('Enter a patient ID to load details.');
      return;
    }
    setLoadingPatient(true);
    try {
      const response = await axios.get(`${API_BASE}?action=patientById&patient_id=${encodeURIComponent(patientId)}`);
      setPatientDetails(response.data.patient || null);
      setPatientError('');
      setDispense((prev) => ({ ...prev, patient_id: patientId }));
    } catch (error) {
      setPatientDetails(null);
      setPatientError('Patient not found. Please check the ID.');
      setDispense((prev) => ({ ...prev, patient_id: '' }));
    } finally {
      setLoadingPatient(false);
    }
  };

  const dispenseMedication = async (event) => {
    event.preventDefault();
    if (!dispense.patient_id) {
      alert('Enter a valid patient ID before dispensing.');
      return;
    }
    try {
      await axios.post(`${API_BASE}?action=pharmacyDispense`, dispense);
      alert('Medication dispensed');
      setDispense({ patient_id: dispense.patient_id, prescribed_by: '', medicine_id: '', dosage: '', quantity: '', duration: '', instructions: '' });
      const res = await axios.get(`${API_BASE}?action=medicines`);
      setMedicines(res.data.medicines || []);
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to dispense medication');
    }
  };

  return (
    <Box>
      <SectionCard title="Pharmacy Module">
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Load Patient</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" onClick={loadPatientData} disabled={loadingPatient} fullWidth>
                {loadingPatient ? 'Loading...' : 'Load Patient'}
              </Button>
            </Grid>
          </Grid>
          {patientError && (
            <Typography color="error" sx={{ mt: 2 }}>{patientError}</Typography>
          )}
          {patientDetails && (
            <Paper sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Patient</Typography>
              <Typography>{patientDetails.full_name} • NIC: {patientDetails.nic || 'N/A'}</Typography>
              <Typography>Contact: {patientDetails.contact_number || 'N/A'} • Age: {patientDetails.age || 'N/A'}</Typography>
              <Typography>Gender: {patientDetails.gender || 'N/A'} • Blood Group: {patientDetails.blood_group || 'N/A'}</Typography>
            </Paper>
          )}
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>Available Medicines</Typography>
        <Grid container spacing={2}>
          {medicines.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.medicine_id}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                <Typography color="text.secondary">Stock: {item.stock}</Typography>
                <Typography color="text.secondary">Expiry: {item.expiry_date || 'N/A'}</Typography>
              </Paper>
            </Grid>
          ))}
          {!medicines.length && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No medicines available in stock.</Typography>
            </Grid>
          )}
        </Grid>

        <Box component="form" onSubmit={dispenseMedication} sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Dispense Medication</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormField label="Patient ID">
                <TextField fullWidth value={dispense.patient_id} disabled />
              </FormField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormField label="Prescribed By">
                <TextField
                  fullWidth
                  value={dispense.prescribed_by}
                  onChange={(e) => setDispense({ ...dispense, prescribed_by: e.target.value })}
                />
              </FormField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormField label="Medicine ID">
                <TextField
                  fullWidth
                  value={dispense.medicine_id}
                  onChange={(e) => setDispense({ ...dispense, medicine_id: e.target.value })}
                />
              </FormField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormField label="Dosage">
                <TextField
                  fullWidth
                  value={dispense.dosage}
                  onChange={(e) => setDispense({ ...dispense, dosage: e.target.value })}
                />
              </FormField>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormField label="Quantity">
                <TextField
                  fullWidth
                  type="number"
                  value={dispense.quantity}
                  onChange={(e) => setDispense({ ...dispense, quantity: e.target.value })}
                />
              </FormField>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormField label="Duration">
                <TextField
                  fullWidth
                  value={dispense.duration}
                  onChange={(e) => setDispense({ ...dispense, duration: e.target.value })}
                />
              </FormField>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormField label="Instructions">
                <TextField
                  fullWidth
                  value={dispense.instructions}
                  onChange={(e) => setDispense({ ...dispense, instructions: e.target.value })}
                />
              </FormField>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={!patientDetails}>Dispense</Button>
        </Box>
      </SectionCard>
    </Box>
  );
}

export function MaternityModule() {
  const initial = { patient_id: '', mother_patient_id: '', gestation_weeks: '', expected_delivery_date: '', risk_level: 'Low', delivery_date: '', delivery_type: '', baby_name: '', baby_gender: 'Female', birth_weight: '', apgar_score: '' };
  return genericModule({
    title: 'Maternity Module',
    endpoint: 'maternityRecord',
    initial,
    fields: [
      { name: 'patient_id', type: 'text' },
      { name: 'mother_patient_id', type: 'text' },
      { name: 'gestation_weeks', type: 'text' },
      { name: 'expected_delivery_date', type: 'date', required: false },
      { name: 'risk_level', type: 'select', options: ['Low', 'Medium', 'High'] },
      { name: 'delivery_date', type: 'date', required: false },
      { name: 'delivery_type', type: 'text', required: false },
      { name: 'baby_name', type: 'text', required: false },
      { name: 'baby_gender', type: 'select', options: ['Female', 'Male', 'Other'] },
      { name: 'birth_weight', type: 'text', required: false },
      { name: 'apgar_score', type: 'text', required: false },
    ],
  });
}

export function EmergencyModule() {
  const initial = { patient_id: '', name: '', age: '', gender: 'Male', emergency_condition: '', arrival_method: '', triage_level: 'Yellow' };
  return genericModule({
    title: 'Emergency Module',
    endpoint: 'emergencyCase',
    initial,
    fields: [
      { name: 'patient_id', type: 'text' },
      { name: 'name', type: 'text' },
      { name: 'age', type: 'number' },
      { name: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'emergency_condition', type: 'text' },
      { name: 'arrival_method', type: 'text', required: false },
      { name: 'triage_level', type: 'select', options: ['Red', 'Orange', 'Yellow', 'Green'] },
    ],
  });
}

export function DoctorDashboard({ user }) {
  const [stats, setStats] = useState({ upcoming_appointments: 0, recent_consultations: 0 });

  useEffect(() => {
    if (!user.doctor_id) return;
    axios.get(`${API_BASE}?action=doctorDashboard&doctor_id=${encodeURIComponent(user.doctor_id)}`).then((res) => setStats(res.data || {}));
  }, [user.doctor_id]);

  return (
    <Box>
      <SectionCard title="Doctor Dashboard">
        <Grid container spacing={2}>
          {user.doctor_id && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Doctor ID</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{user.doctor_id}</Typography>
              </Paper>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Upcoming Appointments</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.upcoming_appointments}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Recent Consultations</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.recent_consultations}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </SectionCard>
    </Box>
  );
}

export function PatientDashboard({ user }) {
  const [summary, setSummary] = useState({ patient: null, appointments: [], prescriptions: [], lab_reports: [], radiology_reports: [] });

  useEffect(() => {
    if (!user.patient_id) return;
    axios.get(`${API_BASE}?action=patientDashboard&patient_id=${encodeURIComponent(user.patient_id)}`).then((res) => setSummary(res.data || {}));
  }, [user.patient_id]);

  const panels = [
    { title: 'Recent Appointments', items: summary.appointments, renderKey: 'appointment_id', render: (item) => `${item.appointment_type} on ${new Date(item.appointment_date).toLocaleString()} • ${item.status}` },
    { title: 'Latest Prescriptions', items: summary.prescriptions, renderKey: 'prescription_id', render: (item) => `${item.medicine_name} — ${item.dosage} • ${item.frequency} • ${item.duration}` },
    { title: 'Lab Reports', items: summary.lab_reports, renderKey: 'lab_test_id', render: (item) => `${item.test_type} • ${item.status}` },
    { title: 'Radiology Reports', items: summary.radiology_reports, renderKey: 'radiology_test_id', render: (item) => `${item.imaging_type} • ${item.status}` },
  ];
  

  return (
    <Box>
      <SectionCard title="Patient Dashboard">
        {summary.patient && (
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{summary.patient.full_name}</Typography>
                <Typography color="text.secondary">Patient ID: {summary.patient.patient_id}</Typography>
                <Typography color="text.secondary">NIC: {summary.patient.nic}</Typography>
                <Typography color="text.secondary">Gender: {summary.patient.gender} • Age: {summary.patient.age}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary">Contact: {summary.patient.contact_number || 'N/A'}</Typography>
                <Typography color="text.secondary">Email: {summary.patient.email || 'N/A'}</Typography>
                <Typography color="text.secondary">Address: {summary.patient.address || 'N/A'}</Typography>
                <Typography color="text.secondary">Blood Group: {summary.patient.blood_group || 'N/A'} • Allergies: {summary.patient.allergies || 'None'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary">Emergency Contact: {summary.patient.emergency_contact_person || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary">Emergency Phone: {summary.patient.emergency_contact_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary">Existing Diseases: {summary.patient.existing_diseases || 'None'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary">Guardian Info: {summary.patient.guardian_info || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography color="text.secondary">Insurance: {summary.patient.insurance_info || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={() => window.print()} sx={{ mt: 2 }}>Print My Details</Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {panels.map((panel) => (
          <Box key={panel.title} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{panel.title}</Typography>
            {panel.items.length ? (
              <Stack spacing={2}>
                {panel.items.map((item) => (
                  <Paper key={item[panel.renderKey]} sx={{ p: 2, borderRadius: 3 }}>
                    <Typography>{panel.render(item)}</Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No records found.</Typography>
            )}
          </Box>
        ))}
      </SectionCard>
    </Box>
  );
}

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}?action=announcements`).then((res) => setAnnouncements(res.data.announcements || []));
  }, []);

  return (
    
    <Box>
      <SectionCard title="Announcements">
        <Stack spacing={2}>
          {announcements.length > 0 ? (
            announcements.map((item) => (
              <Paper key={item.announcement_id} sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>{item.body}</Typography>
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">No announcements available.</Typography>
          )}
        </Stack>
      </SectionCard>
    </Box>
  );
}
