import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddToCloset from './AddToCloset';
import MyCloset from './MyCloset';
import PastUploads from './PastUploads';
import ClosetItemDetails from './ClosetItemDetails';

const Closet: React.FC = () => {
  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Routes>
          <Route path="my" element={<MyCloset />} />
          <Route path="add" element={<AddToCloset />} />
          <Route path="past-uploads" element={<PastUploads />} />
          <Route path="items" element={<ClosetItemDetails />} />
          <Route path="/" element={<MyCloset />} />
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </VStack>
    </Box>
  );
};

export default Closet;
