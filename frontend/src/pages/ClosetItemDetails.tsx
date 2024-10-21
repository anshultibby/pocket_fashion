import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, SimpleGrid, Spinner, useToast, Image } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface ClosetItem {
  id: string;
  masked_images: {
    [key: string]: string;
  };
  classification_results: {
    [key: string]: {
      [key: string]: any;
    };
  };
}

const ClosetItemDetails: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchClosetItems = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/user/closet');
        setClosetItems(response.data.items);
      } catch (error) {
        console.error('Error fetching closet items:', error);
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

    fetchClosetItems();
  }, [isAuthenticated, toast]);

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path;
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  if (loading) return <Spinner />;

  return (
    <Box p={4}>
      <SimpleGrid columns={[1, 2, 3]} spacing={8}>
        {closetItems.flatMap((item) => 
          Object.entries(item.masked_images).map(([key, path]) => (
            <Box key={`${item.id}-${key}`} borderWidth={1} borderRadius="lg" p={4} boxShadow="md">
              <Image
                src={getFullImageUrl(path)}
                alt={`Masked ${key}`}
                objectFit="contain"
                w="100%"
                h="200px"
                mb={4}
              />
              <VStack align="start" spacing={2}>
                {item.classification_results[key] && (
                  Object.entries(item.classification_results[key]).map(([resultKey, value]) => (
                    <Text key={resultKey}>{resultKey}: {value}</Text>
                  ))
                )}
              </VStack>
            </Box>
          ))
        )}
      </SimpleGrid>
    </Box>
  );
};

export default ClosetItemDetails;
