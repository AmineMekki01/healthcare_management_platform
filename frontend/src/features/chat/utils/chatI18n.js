export const isArabicLanguage = (language) => {
  const lang = (language || '').toLowerCase();
  return lang === 'ar' || lang.startsWith('ar-');
};

export const getLocalizedFullName = (user, language) => {
  const useAr = isArabicLanguage(language);

  const first = (useAr ? user?.firstNameAr : user?.firstName) || user?.firstName || user?.firstNameAr || '';
  const last = (useAr ? user?.lastNameAr : user?.lastName) || user?.lastName || user?.lastNameAr || '';

  return `${String(first).trim()} ${String(last).trim()}`.trim();
};

export const getLocalizedChatRecipientName = (chat, language) => {
  return getLocalizedFullName(
    {
      firstName: chat?.firstNameRecipient,
      firstNameAr: chat?.firstNameRecipientAr,
      lastName: chat?.lastNameRecipient,
      lastNameAr: chat?.lastNameRecipientAr,
    },
    language
  );
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const formatChatTimestamp = (dateInput, { t, language } = {}) => {
  if (!dateInput) {
    return typeof t === 'function' ? t('ui.justNow') : '';
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const deltaSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (deltaSeconds >= 0 && deltaSeconds < 60) {
    return typeof t === 'function' ? t('ui.justNow') : '';
  }

  const dayDiff = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);

  const time = new Intl.DateTimeFormat(language || undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (dayDiff === 0) {
    return time;
  }

  if (dayDiff === 1) {
    return `${typeof t === 'function' ? t('messages.yesterday') : ''} ${time}`.trim();
  }

  if (dayDiff === -1) {
    return `${typeof t === 'function' ? t('messages.tomorrow') : ''} ${time}`.trim();
  }

  return new Intl.DateTimeFormat(language || undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
