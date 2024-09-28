import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Dashboard: React.FC = () => {
  return (
    <Box p={8}>
      <Heading mb={4}>Dashboard</Heading>
      <Text>Welcome to your Pocket Fashion dashboard!</Text>
    </Box>
  );
};

export default Dashboard;
