import React from 'react';
import { Box, VStack, Heading } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import AddToCloset from './AddToCloset';
import MyCloset from './MyCloset';

const Closet: React.FC = () => {
  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Routes>
          <Route path="add" element={<AddToCloset />} />
          <Route path="my" element={<MyCloset />} />
          <Route path="/" element={
            <Box textAlign="center" p={8}>
              <Heading as="h2" size="lg">Welcome to Your Closet</Heading>
              <Box mt={4}>
                Please select an option from the side menu to get started.
              </Box>
            </Box>
          } />
        </Routes>
      </VStack>
    </Box>
  );
};

export default Closet;
