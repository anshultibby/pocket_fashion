import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, VStack, useToast, SimpleGrid, Image } from '@chakra-ui/react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import './Closet.css';

interface Clothes {
  id: string;
  image_path: string;
  clothes_mask: string;
  masked_images: string[];
}

const Closet: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [closetItems, setClosetItems] = useState<Clothes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchClosetItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/user/closet');
      setClosetItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching closet items:', error);
      toast({
        title: 'Error fetching closet items',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClosetItems();
    }
  }, [isAuthenticated, fetchClosetItems]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await api.post('/api/user/closet/item', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setClosetItems(prev => [...prev, response.data.item]);
      } catch (error) {
        console.error('Error uploading item:', error);
        toast({
          title: `Error adding item: ${file.name}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`/api/user/closet/item/${itemId}`);
      setClosetItems(closetItems.filter(item => item.id !== itemId));
      toast({
        title: 'Item deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const cleanPath = path.startsWith('data/') ? path.slice(5) : path;
    return `${process.env.REACT_APP_API_URL}/static/${cleanPath}`;
  };

  if (isLoading) return <Box p={8}>Loading...</Box>;

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Box
          {...getRootProps()}
          borderWidth={2}
          borderStyle="dashed"
          borderRadius="md"
          p={4}
          textAlign="center"
          bg={isDragActive ? "gray.100" : "white"}
        >
          <input {...getInputProps()} />
          <Text mb={2}>Drag & drop files here, or click to select files</Text>
          <Button colorScheme="blue">Upload Images</Button>
        </Box>

        {closetItems.length > 0 ? (
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {closetItems.map((item) => (
              <Box key={item.id} borderWidth={1} borderRadius="lg" overflow="hidden">
                <VStack spacing={2} align="stretch">
                  {item.image_path && (
                    <Image
                      src={getImageUrl(item.image_path)}
                      alt="Original Image"
                      objectFit="cover"
                      width="100%"
                      height="200px"
                    />
                  )}
                  {item.clothes_mask && (
                    <Image
                      src={getImageUrl(item.clothes_mask)}
                      alt="Segmentation mask"
                      objectFit="cover"
                      width="100%"
                      height="200px"
                    />
                  )}
                  {Array.isArray(item.masked_images) && item.masked_images.map((maskedPath, index) => (
                    <Image
                      key={index}
                      src={getImageUrl(maskedPath)}
                      alt={`Masked image ${index + 1}`}
                      objectFit="cover"
                      width="100%"
                      height="200px"
                    />
                  ))}
                  <Button onClick={() => deleteItem(item.id)} size="sm" colorScheme="red" m={2}>
                    Delete
                  </Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text>Your closet is empty. Add some items!</Text>
        )}
      </VStack>
    </Box>
  );
};

export default Closet;
