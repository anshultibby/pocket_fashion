import React from 'react';
import { Box, Text, Container } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box as="footer" bg="gray.100" py={3}>
      <Container maxW="container.xl">
        <Text fontSize="sm" textAlign="center">&copy; 2024 Pocket Fashion. All rights reserved.</Text>
      </Container>
    </Box>
  );
};

export default Footer;
