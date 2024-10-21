import React from 'react';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
              <Text mt={4}>
                Please select "Explore Closet" from the side menu to view your items.
              </Text>
            </Box>
          } />
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </VStack>
    </Box>
  );
};

export default Closet;
