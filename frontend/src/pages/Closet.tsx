import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Closet: React.FC = () => {
  return (
    <Box p={8}>
      <Heading mb={4}>My Closet</Heading>
      <Text>Here you'll see your clothing inventory.</Text>
    </Box>
  );
};

export default Closet;
