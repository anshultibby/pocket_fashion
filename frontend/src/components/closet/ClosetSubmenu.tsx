import React from 'react';
import { VStack, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const ClosetSubmenu: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <VStack align="stretch" width="200px" p={4} bg="gray.100">
      <Link
        as={RouterLink}
        to="/closet/add"
        fontWeight={isActive('/closet/add') ? 'bold' : 'normal'}
        color={isActive('/closet/add') ? 'blue.500' : 'gray.700'}
      >
        Upload photos
      </Link>
      <Link
        as={RouterLink}
        to="/closet/my"
        fontWeight={isActive('/closet/overview') ? 'bold' : 'normal'}
        color={isActive('/closet/overview') ? 'blue.500' : 'gray.700'}
      >
        My Closet
      </Link>
      <Link
        as={RouterLink}
        to="/closet/items"
        fontWeight={isActive('/closet/items') ? 'bold' : 'normal'}
        color={isActive('/closet/items') ? 'blue.500' : 'gray.700'}
      >
        Closet Items
      </Link>
      <Link
        as={RouterLink}
        to="/closet/past-uploads"
        fontWeight={isActive('/closet/past-uploads') ? 'bold' : 'normal'}
        color={isActive('/closet/past-uploads') ? 'blue.500' : 'gray.700'}
      >
        Past Uploads
      </Link>
    </VStack>
  );
};

export default ClosetSubmenu;
