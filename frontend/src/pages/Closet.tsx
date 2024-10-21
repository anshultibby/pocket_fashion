import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddToCloset from './AddToCloset';
import MyCloset from './MyCloset';
import PastUploads from './PastUploads';
import ItemTags from './ItemTags';

const Closet: React.FC = () => {
  return (
    <Box p={4}>
      <Routes>
        <Route path="my" element={<MyCloset />} />
        <Route path="add" element={<AddToCloset />} />
        <Route path="past-uploads" element={<PastUploads />} />
        <Route path="items" element={<ItemTags />} />
        <Route path="/" element={<MyCloset />} />
        <Route path="*" element={<Navigate to="/closet" replace />} />
      </Routes>
    </Box>
  );
};

export default Closet;
