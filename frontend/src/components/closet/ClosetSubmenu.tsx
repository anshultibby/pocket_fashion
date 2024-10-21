import React from 'react';
import { VStack, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const ClosetSubmenu = () => {
  return (
    <VStack spacing={4} align="stretch" p={4} bg="gray.100" minWidth="200px">
      <Link as={RouterLink} to="/closet/add">Add Clothes</Link>
      <Link as={RouterLink} to="/closet/my-closet">Explore Closet</Link>
    </VStack>
  );
};

export default ClosetSubmenu;

