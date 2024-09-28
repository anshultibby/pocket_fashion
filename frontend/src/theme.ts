import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0e4ff',
      100: '#cbb2ff',
      200: '#a480ff',
      300: '#7c4dff',
      400: '#541bff',
      500: '#3b01e6',
      600: '#2d00b4',
      700: '#1f0082',
      800: '#110050',
      900: '#060020',
    },
  },
  fonts: {
    heading: '"Playfair Display", serif',
    body: '"Roboto", sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
      },
    },
  },
});