import React from 'react';
import { Box, Flex, Heading, Spacer } from '@chakra-ui/react';

const Header: React.FC = () => {
    return (
    <Box as="header" bg="blue.500" py={4}>
        <Flex maxW="container.lg" mx="auto" alignItems="center">
        <Heading color="white">Pocket Fashion</Heading>
        <Spacer />
        {/* Add navigation menu items here if needed */}
        </Flex>
    </Box>
  );
};

export default Header;
