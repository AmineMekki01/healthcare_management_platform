import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 120,
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const LanguageButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FlagIcon = styled('span')({
  fontSize: '1.2em',
  marginRight: '8px',
});

const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇲🇦',
    direction: 'rtl',
  },
];

const LanguageSelector = ({ variant = 'dropdown', showLabel = true }) => {
  const { i18n, t } = useTranslation('settings');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      const selectedLanguage = languages.find(lang => lang.code === languageCode);
      if (selectedLanguage) {
        document.documentElement.dir = selectedLanguage.direction;
        document.documentElement.lang = languageCode;
        
        localStorage.setItem('i18nextLng', languageCode);
      }
      
      if (variant === 'icon') {
        setAnchorEl(null);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (variant === 'icon') {
    return (
      <>
        <LanguageButton
          onClick={handleMenuOpen}
          aria-label={t('language.selectLanguage')}
          title={`${t('language.currentLanguage')}: ${currentLanguage.nativeName}`}
        >
          <LanguageIcon />
        </LanguageButton>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === i18n.language}
            >
              <ListItemIcon>
                <FlagIcon>{language.flag}</FlagIcon>
                {language.code === i18n.language && <CheckIcon color="primary" />}
              </ListItemIcon>
              <ListItemText>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {language.nativeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language.name}
                  </Typography>
                </Box>
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <Box>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('language.selectLanguage')}
        </Typography>
      )}
      
      <StyledFormControl fullWidth size="small">
        <Select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            const language = languages.find(lang => lang.code === selected);
            return language ? (
              <Box display="flex" alignItems="center">
                <FlagIcon>{language.flag}</FlagIcon>
                <Typography variant="body2">
                  {language.nativeName}
                </Typography>
              </Box>
            ) : '';
          }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Box display="flex" alignItems="center" width="100%">
                <FlagIcon>{language.flag}</FlagIcon>
                <Box flexGrow={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {language.nativeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language.name}
                  </Typography>
                </Box>
                {language.code === i18n.language && (
                  <CheckIcon color="primary" fontSize="small" />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </StyledFormControl>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {t('language.currentLanguage')}: {currentLanguage.nativeName}
      </Typography>
    </Box>
  );
};

export default LanguageSelector;
