import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
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
  Checkbox,
  ListItemText,
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
  const { t, i18n } = useTranslation('settings');
  const { userId } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [awards, setAwards] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [consultationFee, setConsultationFee] = useState(0);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [acceptedInsuranceCodes, setAcceptedInsuranceCodes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, providers] = await Promise.all([
          settingsService.getDoctorAdditionalInfo(userId),
          settingsService.getInsuranceProviders(),
        ]);
        setHospitals(data.hospitals || []);
        setOrganizations(data.organizations || []);
        setAwards(data.awards || []);
        setCertifications(data.certifications || []);
        setLanguages(data.languages || []);

        setConsultationFee(Number(data.consultationFee || 0));
        setAcceptedInsuranceCodes(Array.isArray(data.acceptedInsuranceCodes) ? data.acceptedInsuranceCodes : []);
        setInsuranceProviders(Array.isArray(providers) ? providers : []);
      } catch (error) {
        console.error('Error fetching additional info:', error);
      }
    };
    fetchData();
  }, [userId]);

  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');
  const isFrench = (i18n?.language || '').toLowerCase().startsWith('fr');

  const getProviderDisplayName = (provider) => {
    if (!provider) return '';
    if (isArabic) return provider.nameAr || provider.name || provider.code;
    if (isFrench) return provider.nameFr || provider.name || provider.code;
    return provider.name || provider.code;
  };

  const getProviderNameByCode = (code) => {
    const p = insuranceProviders.find((x) => x.code === code);
    return p ? getProviderDisplayName(p) : code;
  };

  const handleSubmit = async () => {
    try {
        const data = await settingsService.updateDoctorAdditionalInfo(userId, {
            hospitals,
            organizations,
            awards,
            certifications,
            languages,
            consultationFee: Number(consultationFee || 0),
            acceptedInsuranceCodes,
        });
        console.log('Information updated:', data);
        alert(t('doctorInfo.success.informationUpdated'));
    } catch (error) {
        console.error('Error updating additional info:', error);
        alert(t('doctorInfo.errors.updateFailed'));
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <Paper style={{ padding: '20px', marginBottom: '30px' }}>
        <Typography variant="h5" style={{ fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          {t('doctorInfo.sections.practice.title')}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={t('doctorInfo.sections.practice.fields.consultationFee')}
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              inputProps={{ min: 0 }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={t('doctorInfo.sections.practice.fields.acceptedInsurances')}
              value={acceptedInsuranceCodes}
              onChange={(e) => {
                const value = e.target.value;
                setAcceptedInsuranceCodes(typeof value === 'string' ? value.split(',') : value);
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (Array.isArray(selected) ? selected.map(getProviderNameByCode).join(', ') : '')
              }}
              variant="outlined"
            >
              {insuranceProviders.map((provider) => (
                <MenuItem key={provider.code} value={provider.code}>
                  <Checkbox checked={acceptedInsuranceCodes.indexOf(provider.code) > -1} />
                  <ListItemText primary={getProviderDisplayName(provider)} />
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <InfoSection
        title={t('doctorInfo.sections.hospitals.title')}
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
          { name: 'hospitalName', label: t('doctorInfo.sections.hospitals.fields.hospitalName') },
          { name: 'position', label: t('doctorInfo.sections.hospitals.fields.position') },
          { name: 'startDate', label: t('doctorInfo.sections.hospitals.fields.startDate'), type: 'date' },
          { name: 'endDate', label: t('doctorInfo.sections.hospitals.fields.endDate'), type: 'date' },
          { name: 'description', label: t('doctorInfo.sections.hospitals.fields.description'), multiline: true },
        ]}
      />

      <InfoSection
        title={t('doctorInfo.sections.organizations.title')}
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
          { name: 'organizationName', label: t('doctorInfo.sections.organizations.fields.organizationName') },
          { name: 'role', label: t('doctorInfo.sections.organizations.fields.role') },
          { name: 'startDate', label: t('doctorInfo.sections.organizations.fields.startDate'), type: 'date' },
          { name: 'endDate', label: t('doctorInfo.sections.organizations.fields.endDate'), type: 'date' },
          { name: 'description', label: t('doctorInfo.sections.organizations.fields.description'), multiline: true },
        ]}
      />

      <InfoSection
        title={t('doctorInfo.sections.awards.title')}
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
          { name: 'awardName', label: t('doctorInfo.sections.awards.fields.awardName') },
          { name: 'dateAwarded', label: t('doctorInfo.sections.awards.fields.dateAwarded'), type: 'date' },
          { name: 'issuingOrganization', label: t('doctorInfo.sections.awards.fields.issuingOrganization') },
          { name: 'description', label: t('doctorInfo.sections.awards.fields.description'), multiline: true },
        ]}
      />

      <InfoSection
        title={t('doctorInfo.sections.certifications.title')}
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
          { name: 'certificationName', label: t('doctorInfo.sections.certifications.fields.certificationName') },
          { name: 'issuedBy', label: t('doctorInfo.sections.certifications.fields.issuedBy') },
          { name: 'issueDate', label: t('doctorInfo.sections.certifications.fields.issueDate'), type: 'date' },
          { name: 'expirationDate', label: t('doctorInfo.sections.certifications.fields.expirationDate'), type: 'date' },
          { name: 'description', label: t('doctorInfo.sections.certifications.fields.description'), multiline: true },
        ]}
      />

      <InfoSection
        title={t('doctorInfo.sections.languages.title')}
        icon={<LanguageIcon fontSize="large" />}
        items={languages}
        setItems={setLanguages}
        newItem={{
          languageName: '',
          proficiencyLevel: '',
        }}
        fields={[
          { name: 'languageName', label: t('doctorInfo.sections.languages.fields.languageName') },
          {
            name: 'proficiencyLevel',
            label: t('doctorInfo.sections.languages.fields.proficiencyLevel'),
            select: true,
            options: [t('doctorInfo.sections.languages.proficiency.basic'), t('doctorInfo.sections.languages.proficiency.conversational'), t('doctorInfo.sections.languages.proficiency.fluent'), t('doctorInfo.sections.languages.proficiency.native')],
          },
        ]}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        style={{ marginTop: '20px' }}
      >
        {t('doctorInfo.buttons.saveInformation')}
      </Button>
    </Container>
  );
}

function InfoSection({ title, items, setItems, newItem, fields, icon }) {
  const { t } = useTranslation('settings');
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
        onClick={() => setItems((prev) => [...prev, { ...newItem }])}
        style={{ 
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5px 10px',
        }}
      >
        <AddIcon style={{
          fontSize: '1.3rem',
        }}/>
        <Typography variant="body2">
          {t('doctorInfo.buttons.add')}
        </Typography>
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
