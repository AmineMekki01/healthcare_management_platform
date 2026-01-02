export const SPECIALTY_CODES = [
  'generalPractice',
  'internalMedicine',
  'pediatrics',
  'cardiology',
  'dermatology',
  'dentistry',
  'endocrinology',
  'gastroenterology',
  'hematology',
  'infectiousDisease',
  'nephrology',
  'neurology',
  'oncology',
  'ophthalmology',
  'orthopedics',
  'otolaryngology',
  'pathology',
  'psychiatry',
  'pulmonology',
  'radiology',
  'rheumatology',
  'surgery',
  'urology',
  'emergencyMedicine',
  'familyMedicine',
  'anesthesiology',
  'gynecology',
  'obstetricsGynecology',
  'physicalMedicine',
  'plasticSurgery',
  'sportsMedicine',
];

const SPECIALTY_ALIASES = {
  general: 'generalPractice',
  'general practice': 'generalPractice',
  'general medicine': 'generalPractice',
  'primary care': 'generalPractice',

  'internal medicine': 'internalMedicine',

  pediatrics: 'pediatrics',
  paediatrics: 'pediatrics',

  cardiology: 'cardiology',
  dermatology: 'dermatology',
  dentistry: 'dentistry',
  endocrinology: 'endocrinology',
  gastroenterology: 'gastroenterology',
  hematology: 'hematology',
  'infectious disease': 'infectiousDisease',
  nephrology: 'nephrology',
  neurology: 'neurology',
  oncology: 'oncology',
  ophthalmology: 'ophthalmology',
  orthopedics: 'orthopedics',
  orthopaedics: 'orthopedics',
  otolaryngology: 'otolaryngology',
  ent: 'otolaryngology',
  orl: 'otolaryngology',
  pathology: 'pathology',
  psychiatry: 'psychiatry',
  pulmonology: 'pulmonology',
  radiology: 'radiology',
  rheumatology: 'rheumatology',
  surgery: 'surgery',
  urology: 'urology',
  'emergency medicine': 'emergencyMedicine',
  'family medicine': 'familyMedicine',
  anesthesiology: 'anesthesiology',
  gynecology: 'gynecology',
  gynaecology: 'gynecology',
  'obstetrics and gynecology': 'obstetricsGynecology',
  'obstetrics & gynecology': 'obstetricsGynecology',
  'physical medicine': 'physicalMedicine',
  'plastic surgery': 'plasticSurgery',
  'sports medicine': 'sportsMedicine',
};

export const normalizeSpecialtyCode = (input) => {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (raw === 'general') return 'generalPractice';

  const codeMatch = SPECIALTY_CODES.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (codeMatch) return codeMatch;

  const alias = SPECIALTY_ALIASES[raw.toLowerCase()];
  if (alias) return alias;

  return raw;
};

export const getLocalizedSpecialtyLabel = (specialtyInput, tMedical) => {
  const normalized = normalizeSpecialtyCode(specialtyInput);
  if (!normalized) return '';

  const key = `specialties.${normalized}`;
  const translated = typeof tMedical === 'function' ? tMedical(key) : '';

  if (!translated || translated === key) {
    return String(specialtyInput || normalized);
  }

  return translated;
};

export const buildSpecialtyOptions = (tMedical, { includeEmpty = false, emptyLabel = '' } = {}) => {
  const options = SPECIALTY_CODES.map((code) => ({
    value: code,
    label: getLocalizedSpecialtyLabel(code, tMedical),
  }));

  if (!includeEmpty) return options;

  return [{ value: '', label: emptyLabel }, ...options];
};
