import React from 'react';
import { VStack, Link, Box } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaUpload, FaBoxOpen, FaTags, FaHistory } from 'react-icons/fa';

const ClosetSubmenu: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <VStack
      align="stretch"
      width="200px"
      p={4}
      bg="gray.100"
      spacing={3}
      borderRadius="md"
      boxShadow="sm"
    >
      <Link
        as={RouterLink}
        to="/closet/add"
        fontWeight={isActive('/closet/add') ? 'bold' : 'normal'}
        color={isActive('/closet/add') ? 'blue.500' : 'gray.700'}
        display="flex"
        alignItems="center"
        _hover={{ textDecoration: 'none', bg: 'gray.200' }}
        p={2}
        borderRadius="md"
      >
        <FaUpload style={{ marginRight: '8px' }} />
        Upload Photos
      </Link>
      <Link
        as={RouterLink}
        to="/closet/my"
        fontWeight={isActive('/closet/my') ? 'bold' : 'normal'}
        color={isActive('/closet/my') ? 'blue.500' : 'gray.700'}
        display="flex"
        alignItems="center"
        _hover={{ textDecoration: 'none', bg: 'gray.200' }}
        p={2}
        borderRadius="md"
      >
        <FaBoxOpen style={{ marginRight: '8px' }} />
        Extracted Items
      </Link>
      <Link
        as={RouterLink}
        to="/closet/items"
        fontWeight={isActive('/closet/items') ? 'bold' : 'normal'}
        color={isActive('/closet/items') ? 'blue.500' : 'gray.700'}
        display="flex"
        alignItems="center"
        _hover={{ textDecoration: 'none', bg: 'gray.200' }}
        p={2}
        borderRadius="md"
      >
        <FaTags style={{ marginRight: '8px' }} />
        Item Tags
      </Link>
      <Link
        as={RouterLink}
        to="/closet/past-uploads"
        fontWeight={isActive('/closet/past-uploads') ? 'bold' : 'normal'}
        color={isActive('/closet/past-uploads') ? 'blue.500' : 'gray.700'}
        display="flex"
        alignItems="center"
        _hover={{ textDecoration: 'none', bg: 'gray.200' }}
        p={2}
        borderRadius="md"
      >
        <FaHistory style={{ marginRight: '8px' }} />
        Past Uploads
      </Link>
    </VStack>
  );
};

export default ClosetSubmenu;
