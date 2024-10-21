import React, { useState, useEffect } from 'react';
import { Box, Image, Spinner, useToast, Grid, VStack, HStack } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Make sure this is correctly set in your .env file
const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface ClosetItem {
  id: string;
  image_path: string;
  clothes_mask: string;
  masked_images: string[];
}

const MyCloset: React.FC = () => {
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
    <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
      {closetItems.map((item) => (
        <Box key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} boxShadow="md">
          <VStack spacing={4}>
            <Grid templateColumns="repeat(3, 1fr)" gap={3} width="100%">
              {item.masked_images.map((maskedImage, index) => (
                <Box key={`masked-${index}`} height="150px" bg="gray.50" borderRadius="md">
                  <Image
                    src={getFullImageUrl(maskedImage)}
                    alt={`Masked Image ${index + 1}`}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                </Box>
              ))}
            </Grid>
            <HStack spacing={3} width="100%">
              <Box height="80px" width="50%" bg="gray.50" borderRadius="md">
                <Image
                  src={getFullImageUrl(item.image_path)}
                  alt="Original Image"
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
              </Box>
              <Box height="80px" width="50%" bg="gray.50" borderRadius="md">
                <Image
                  src={getFullImageUrl(item.clothes_mask)}
                  alt="Clothes Mask"
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
              </Box>
            </HStack>
          </VStack>
        </Box>
      ))}
    </Grid>
  );
};

export default MyCloset;
