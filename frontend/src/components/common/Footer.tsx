import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box as="footer" bg="gray.100" py={4} textAlign="center">
      <Text>&copy; 2024 Pocket Fashion. All rights reserved.</Text>
    </Box>
  );
};

export default Footer;
