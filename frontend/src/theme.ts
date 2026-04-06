import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Primary green - eco-construction, nature, main brand color
const ecoPrimary: MantineColorsTuple = [
  '#f1f7f1',
  '#e2ede2',
  '#c5dbca',
  '#a8c991',
  '#8bb789',
  '#70A771',
  '#659766',
  '#547d55',
  '#436344',
  '#324a33',
];

// Secondary blue - UI accents, buttons, links, stepper
const ecoBlue: MantineColorsTuple = [
  '#f0f4f8',
  '#dce4ee',
  '#b8c9dd',
  '#93adcb',
  '#7a9bbd',
  '#677DA3',
  '#5b7196',
  '#4d6080',
  '#3f4f69',
  '#313e52',
];

// Terracotta - permaculture category badge/label only
const ecoTerracotta: MantineColorsTuple = [
  '#fcedee',
  '#f3dada',
  '#e7b5b6',
  '#db8e91',
  '#d16f73',
  '#c9696b',
  '#c25255',
  '#ab4144',
  '#94383a',
  '#7d2f31',
];

export const theme = createTheme({
  primaryColor: 'eco-primary',
  colors: {
    'eco-primary': ecoPrimary,
    'eco-blue': ecoBlue,
    'eco-terracotta': ecoTerracotta,
  },
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  defaultRadius: 'md',
  components: {
    TextInput: {
      defaultProps: { radius: 'md' },
    },
    PasswordInput: {
      defaultProps: { radius: 'md' },
    },
    Textarea: {
      defaultProps: { radius: 'md' },
    },
    Select: {
      defaultProps: { radius: 'md' },
    },
    MultiSelect: {
      defaultProps: { radius: 'md' },
    },
    NumberInput: {
      defaultProps: { radius: 'md' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'lg' },
    },
    Avatar: {
      defaultProps: {
        imageProps: { referrerPolicy: 'no-referrer' },
      },
    },
  },
});
