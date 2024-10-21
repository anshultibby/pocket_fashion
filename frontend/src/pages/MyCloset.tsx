import React, { useState, useEffect } from 'react';
import { Box, VStack, Heading, SimpleGrid, Image, Text, Spinner, useToast } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface ClosetItem {
  id: string;
  image_path: string;
  // Add other properties as needed
}

const MyCloset: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClosetItems();
    }
  }, [isAuthenticated]);

  const fetchClosetItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/closet');
      setClosetItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch closet items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch closet items. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" p={8}>
        <Spinner size="xl" />
        <Text mt={4}>Loading your closet...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h2" size="lg">My Closet</Heading>
      {closetItems.length === 0 ? (
        <Text>Your closet is empty. Add some items to get started!</Text>
      ) : (
        <SimpleGrid columns={[2, 3, 4]} spacing={4}>
          {closetItems.map((item) => (
            <Box key={item.id} borderWidth={1} borderRadius="lg" overflow="hidden">
              <Image src={item.image_path} alt={`Closet item ${item.id}`} />
            </Box>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};

export default MyCloset;
