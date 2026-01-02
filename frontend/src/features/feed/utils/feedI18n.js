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

export const getLocalizedPostAuthorName = (post, language) => {
  return getLocalizedFullName(
    {
      firstName: post?.doctorFirstName,
      firstNameAr: post?.doctorFirstNameAr,
      lastName: post?.doctorLastName,
      lastNameAr: post?.doctorLastNameAr,
      fullName: post?.doctorName,
    },
    language
  );
};

export const getLocalizedCommentAuthorName = (comment, language) => {
  return getLocalizedFullName(
    {
      firstName: comment?.userFirstName,
      firstNameAr: comment?.userFirstNameAr,
      lastName: comment?.userLastName,
      lastNameAr: comment?.userLastNameAr,
      fullName: comment?.userName,
    },
    language
  );
};

export const formatFeedTimestamp = (dateInput, language) => {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(language || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const specialtyCodeMap = {
  general: 'generalPractice',
};

export const normalizeSpecialtyCode = (code) => {
  const raw = String(code || '').trim();
  if (!raw) return '';
  return specialtyCodeMap[raw] || raw;
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
