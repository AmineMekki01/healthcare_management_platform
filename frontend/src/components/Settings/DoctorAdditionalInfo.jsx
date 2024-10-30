import React, { useState, useEffect, useContext } from 'react';
import axios from '../axiosConfig';
import { AuthContext } from '../Auth/AuthContext';
import {
  Container,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
  Paper,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalHospital as HospitalIcon,
  Business as OrganizationIcon,
  EmojiEvents as AwardIcon,
  Verified as CertificationIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

export default function DoctorAdditionalInfo() {
  const { userId } = useContext(AuthContext);

  const [hospitals, setHospitals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [awards, setAwards] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/v1/doctor/additional-info/${userId}`);
        setHospitals(response.data.hospitals || []);
        setOrganizations(response.data.organizations || []);
        setAwards(response.data.awards || []);
        setCertifications(response.data.certifications || []);
        setLanguages(response.data.languages || []);
      } catch (error) {
        console.error('Error fetching additional info:', error);
      }
    };
    fetchData();
  }, [userId]);

  const handleAddItem = (setter, newItem) => {
    setter((prevItems) => [...prevItems, newItem]);
  };

  const handleRemoveItem = (setter, index) => {
    setter((prevItems) => prevItems.filter((_, idx) => idx !== index));
  };

  const handleChangeItem = (setter, index, field, value) => {
    setter((prevItems) => {
      const items = [...prevItems];
      items[index][field] = value;
      return items;
    });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`/api/v1/doctor/additional-info/${userId}`, {
        hospitals,
        organizations,
        awards,
        certifications,
        languages,
      });
      alert('Information updated successfully!');
    } catch (error) {
      console.error('Error updating additional info:', error);
      alert('Failed to update information.');
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <InfoSection
        title="Hospitals"
        icon={<HospitalIcon fontSize="large" />}
        items={hospitals}
        setItems={setHospitals}
        newItem={{
          hospital_name: '',
          position: '',
          start_date: '',
          end_date: '',
          description: '',
        }}
        fields={[
          { name: 'hospital_name', label: 'Hospital Name' },
          { name: 'position', label: 'Position' },
          { name: 'start_date', label: 'Start Date', type: 'date' },
          { name: 'end_date', label: 'End Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Organizations"
        icon={<OrganizationIcon fontSize="large" />}
        items={organizations}
        setItems={setOrganizations}
        newItem={{
          organization_name: '',
          role: '',
          start_date: '',
          end_date: '',
          description: '',
        }}
        fields={[
          { name: 'organization_name', label: 'Organization Name' },
          { name: 'role', label: 'Role' },
          { name: 'start_date', label: 'Start Date', type: 'date' },
          { name: 'end_date', label: 'End Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Awards"
        icon={<AwardIcon fontSize="large" />}
        items={awards}
        setItems={setAwards}
        newItem={{
          award_name: '',
          date_awarded: '',
          issuing_organization: '',
          description: '',
        }}
        fields={[
          { name: 'award_name', label: 'Award Name' },
          { name: 'date_awarded', label: 'Date Awarded', type: 'date' },
          { name: 'issuing_organization', label: 'Issuing Organization' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Certifications"
        icon={<CertificationIcon fontSize="large" />}
        items={certifications}
        setItems={setCertifications}
        newItem={{
          certification_name: '',
          issued_by: '',
          issue_date: '',
          expiration_date: '',
          description: '',
        }}
        fields={[
          { name: 'certification_name', label: 'Certification Name' },
          { name: 'issued_by', label: 'Issued By' },
          { name: 'issue_date', label: 'Issue Date', type: 'date' },
          { name: 'expiration_date', label: 'Expiration Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Languages"
        icon={<LanguageIcon fontSize="large" />}
        items={languages}
        setItems={setLanguages}
        newItem={{
          language_name: '',
          proficiency_level: '',
        }}
        fields={[
          { name: 'language_name', label: 'Language Name' },
          {
            name: 'proficiency_level',
            label: 'Proficiency Level',
            select: true,
            options: ['Basic', 'Conversational', 'Fluent', 'Native'],
          },
        ]}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        style={{ marginTop: '20px' }}
      >
        Save Information
      </Button>
    </Container>
  );
}

function InfoSection({ title, items, setItems, newItem, fields, icon }) {
  return (
    <Paper style={{ padding: '20px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {icon && React.cloneElement(icon, { style: { marginRight: '10px', color: '#6dc8b7' } })}
        <Typography variant="h5" style={{ fontWeight: 'bold', color: '#333' }}>
          {title}
        </Typography>
      </div>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setItems((prev) => [...prev, { ...newItem }])}
        style={{ marginBottom: '20px' }}
      >
        Add {title.slice(0, -1)}
      </Button>
      {items.map((item, index) => (
        <Paper
          key={index}
          style={{ padding: '15px', marginBottom: '15px' }}
          variant="outlined"
        >
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} sm={11}>
              <Grid container spacing={2}>
                {fields.map((field) => (
                  <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
                    {field.select ? (
                      <TextField
                        select
                        fullWidth
                        label={field.label}
                        value={item[field.name]}
                        onChange={(e) =>
                          setItems((prev) => {
                            const items = [...prev];
                            items[index][field.name] = e.target.value;
                            return items;
                          })
                        }
                        variant="outlined"
                      >
                        {field.options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        type={field.type || 'text'}
                        label={field.label}
                        value={item[field.name]}
                        onChange={(e) =>
                          setItems((prev) => {
                            const items = [...prev];
                            items[index][field.name] = e.target.value;
                            return items;
                          })
                        }
                        variant="outlined"
                        multiline={field.multiline || false}
                        rows={field.multiline ? 3 : 1}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} sm={1} style={{ textAlign: 'center' }}>
              <IconButton
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                edge="end"
                aria-label="delete"
                color="secondary"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Paper>
  );
}
