import { createTheme } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

export const RTL_LANGUAGES = ['ar'];

export const isRTL = (language) => {
  return RTL_LANGUAGES.includes(language);
};

export const createRTLTheme = (baseTheme, language) => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  
  return createTheme({
    ...baseTheme,
    direction,
    typography: {
      ...baseTheme.typography,
      ...(isRTL(language) && {
        fontFamily: [
          'Noto Sans Arabic',
          'Amiri',
          'Cairo',
          'Tajawal',
          'Arial',
          'sans-serif'
        ].join(','),
      }),
    },
    components: {
      ...baseTheme.components,
      MuiTextField: {
        ...baseTheme.components?.MuiTextField,
        styleOverrides: {
          ...baseTheme.components?.MuiTextField?.styleOverrides,
          root: {
            ...baseTheme.components?.MuiTextField?.styleOverrides?.root,
            ...(isRTL(language) && {
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }),
          },
        },
      },
      MuiButton: {
        ...baseTheme.components?.MuiButton,
        styleOverrides: {
          ...baseTheme.components?.MuiButton?.styleOverrides,
          root: {
            ...baseTheme.components?.MuiButton?.styleOverrides?.root,
            ...(isRTL(language) && {
              '& .MuiButton-startIcon': {
                marginLeft: 8,
                marginRight: -4,
              },
              '& .MuiButton-endIcon': {
                marginLeft: -4,
                marginRight: 8,
              },
            }),
          },
        },
      },
      MuiDrawer: {
        ...baseTheme.components?.MuiDrawer,
        styleOverrides: {
          ...baseTheme.components?.MuiDrawer?.styleOverrides,
          paper: {
            ...baseTheme.components?.MuiDrawer?.styleOverrides?.paper,
            ...(isRTL(language) && {
              right: 0,
              left: 'auto',
            }),
          },
        },
      },
    },
  });
};

export const getStylisPlugins = (language) => {
  return isRTL(language) ? [prefixer, rtlPlugin] : [prefixer];
};

export const updateDocumentDirection = (language) => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  
  if (isRTL(language)) {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
};

export const rtlSpacing = (language, left, right) => {
  if (isRTL(language)) {
    return {
      marginLeft: right,
      marginRight: left,
      paddingLeft: right,
      paddingRight: left,
    };
  }
  return {
    marginLeft: left,
    marginRight: right,
    paddingLeft: left,
    paddingRight: right,
  };
};

export const rtlPosition = (language, leftValue, rightValue) => {
  if (isRTL(language)) {
    return {
      left: rightValue,
      right: leftValue,
    };
  }
  return {
    left: leftValue,
    right: rightValue,
  };
};
