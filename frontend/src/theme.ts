import { createTheme, type MantineColorsTuple } from '@mantine/core';

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
    'eco-terracotta': ecoTerracotta,
  },
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});
