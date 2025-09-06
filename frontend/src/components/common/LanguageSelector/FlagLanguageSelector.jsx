import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const FlagButton = styled(IconButton)(({ theme }) => ({
  padding: '4px',
  borderRadius: '50%',
  border: `2px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'scale(1.05)',
  },
  transition: 'all 0.2s ease-in-out',
}));

const FlagIcon = styled('span')({
  fontSize: '1.5em',
  display: 'block',
  lineHeight: 1,
});

const MenuFlagIcon = styled('span')({
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

const FlagLanguageSelector = ({ variant = 'navbar' }) => {
  const { i18n } = useTranslation();
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
      
      setAnchorEl(null);
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

  return (
    <>
      <Tooltip title={`Language: ${currentLanguage.nativeName}`} arrow>
        <FlagButton
          onClick={handleMenuOpen}
          aria-label="Select language"
          size="small"
        >
          <FlagIcon>{currentLanguage.flag}</FlagIcon>
        </FlagButton>
      </Tooltip>
      
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
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === i18n.language}
            sx={{
              py: 1,
              px: 2,
            }}
          >
            <Box display="flex" alignItems="center" width="100%">
              <MenuFlagIcon>{language.flag}</MenuFlagIcon>
              <Typography variant="body2" fontWeight="medium">
                {language.nativeName}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FlagLanguageSelector;
