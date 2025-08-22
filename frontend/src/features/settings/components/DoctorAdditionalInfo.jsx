import React, { useState, useEffect, useContext } from 'react';
import axios from '../../../components/axiosConfig';
import { AuthContext } from './../../../features/auth/context/AuthContext';
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

import { settingsService } from '../services/settingsService';

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
        const data = await settingsService.getDoctorAdditionalInfo(userId);
        setHospitals(data.hospitals || []);
        setOrganizations(data.organizations || []);
        setAwards(data.awards || []);
        setCertifications(data.certifications || []);
        setLanguages(data.languages || []);
      } catch (error) {
        console.error('Error fetching additional info:', error);
      }
    };
    fetchData();
  }, [userId]);

  const handleSubmit = async () => {
    try {
        const data = await settingsService.updateDoctorAdditionalInfo(userId, {
            hospitals,
            organizations,
            awards,
            certifications,
            languages,
        });
        console.log('Information updated:', data);
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
          hospitalName: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
        }}
        fields={[
          { name: 'hospitalName', label: 'Hospital Name' },
          { name: 'position', label: 'Position' },
          { name: 'startDate', label: 'Start Date', type: 'date' },
          { name: 'endDate', label: 'End Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Organizations"
        icon={<OrganizationIcon fontSize="large" />}
        items={organizations}
        setItems={setOrganizations}
        newItem={{
          organizationName: '',
          role: '',
          startDate: '',
          endDate: '',
          description: '',
        }}
        fields={[
          { name: 'organizationName', label: 'Organization Name' },
          { name: 'role', label: 'Role' },
          { name: 'startDate', label: 'Start Date', type: 'date' },
          { name: 'endDate', label: 'End Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Awards"
        icon={<AwardIcon fontSize="large" />}
        items={awards}
        setItems={setAwards}
        newItem={{
          awardName: '',
          dateAwarded: '',
          issuingOrganization: '',
          description: '',
        }}
        fields={[
          { name: 'awardName', label: 'Award Name' },
          { name: 'dateAwarded', label: 'Date Awarded', type: 'date' },
          { name: 'issuingOrganization', label: 'Issuing Organization' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Certifications"
        icon={<CertificationIcon fontSize="large" />}
        items={certifications}
        setItems={setCertifications}
        newItem={{
          certificationName: '',
          issuedBy: '',
          issueDate: '',
          expirationDate: '',
          description: '',
        }}
        fields={[
          { name: 'certificationName', label: 'Certification Name' },
          { name: 'issuedBy', label: 'Issued By' },
          { name: 'issueDate', label: 'Issue Date', type: 'date' },
          { name: 'expirationDate', label: 'Expiration Date', type: 'date' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <InfoSection
        title="Languages"
        icon={<LanguageIcon fontSize="large" />}
        items={languages}
        setItems={setLanguages}
        newItem={{
          languageName: '',
          proficiencyLevel: '',
        }}
        fields={[
          { name: 'languageName', label: 'Language Name' },
          {
            name: 'proficiencyLevel',
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
