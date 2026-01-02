export const isArabicLanguage = (language) => {
  const lang = (language || '').toLowerCase();
  return lang === 'ar' || lang.startsWith('ar-');
};

export const getLocalizedFullName = (user, language) => {
  const useAr = isArabicLanguage(language);

  const first = (useAr ? user?.firstNameAr : user?.firstName) || user?.firstName || user?.firstNameAr || '';
  const last = (useAr ? user?.lastNameAr : user?.lastName) || user?.lastName || user?.lastNameAr || '';

  if (String(first).trim() || String(last).trim()) {
    return `${String(first).trim()} ${String(last).trim()}`.trim();
  }

  return String(user?.fullName || user?.fullNameAr || '').trim();
};

export const getLocalizedDoctorName = (reservation, language) => {
  return getLocalizedFullName(
    {
      firstName: reservation?.doctorFirstName,
      firstNameAr: reservation?.doctorFirstNameAr,
      lastName: reservation?.doctorLastName,
      lastNameAr: reservation?.doctorLastNameAr,
      fullName: reservation?.doctorName,
    },
    language
  );
};

export const getLocalizedPatientName = (reservation, language) => {
  return getLocalizedFullName(
    {
      firstName: reservation?.patientFirstName,
      firstNameAr: reservation?.patientFirstNameAr,
      lastName: reservation?.patientLastName,
      lastNameAr: reservation?.patientLastNameAr,
      fullName: reservation?.patientName,
    },
    language
  );
};

export const getDoctorPrefix = (language) => {
  const lang = (language || '').toLowerCase();
  if (lang === 'ar' || lang.startsWith('ar-')) return 'د.';
  return 'Dr.';
};

export const formatAppointmentDate = (dateInput, language) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(language || undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString(language || undefined);
  }
};

export const formatAppointmentTime = (dateInput, language) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(language || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleTimeString(language || undefined, { hour: '2-digit', minute: '2-digit' });
  }
};

export const normalizeSpecialtyCode = (code) => {
  const raw = String(code || '').trim();
  if (!raw) return '';
  if (raw === 'general') return 'generalPractice';
  return raw;
};

export const getLocalizedSpecialtyLabel = (specialtyCode, tMedical) => {
  const normalized = normalizeSpecialtyCode(specialtyCode);
  if (!normalized) return '';

  const key = `specialties.${normalized}`;
  const translated = typeof tMedical === 'function' ? tMedical(key) : '';

  if (!translated || translated === key) {
    return String(specialtyCode || normalized);
  }

  return translated;
};

export const formatTime24HHmm = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
