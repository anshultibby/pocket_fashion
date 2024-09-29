import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Input, useToast, FormControl, FormLabel } from '@chakra-ui/react';
import api from '../api/axios';
import { AxiosError } from 'axios';

interface Clothes {
  id: string;
  image_path: string;
  clothes_mask: string;
  category: string;
  subcategory: string;
  color: string;
  attributes: Record<string, any>;
}

const Closet: React.FC = () => {
  const [hasCloset, setHasCloset] = useState<boolean | null>(null);
  const [closetItems, setClosetItems] = useState<Clothes[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const toast = useToast();

  useEffect(() => {
    checkCloset();
  }, []);

  const checkCloset = async () => {
    try {
      const response = await api.get('/api/user/closet');
      setHasCloset(true);
      setClosetItems(response.data.closet_stats.items || []);
    } catch (error) {
      console.error('Error fetching closet:', error);
      if ((error as AxiosError).response?.status === 404) {
        setHasCloset(false);
      } else if ((error as AxiosError).response?.status === 401) {
        // Redirect to login page or refresh token
        window.location.href = '/';
      } else {
        toast({
          title: 'Error checking closet',
          description: 'An unexpected error occurred',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const createCloset = async () => {
    try {
      const response = await api.post('/api/user/closet', {});
      toast({
        title: 'Closet created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasCloset(true);
      // If the API returns the created closet data, you can set it here
      // setClosetItems(response.data.closet_stats.items || []);
    } catch (error) {
      console.error('Error creating closet:', error);
      toast({
        title: 'Error creating closet',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const addItem = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      await api.post('/api/user/closet/item', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedFile(null);
      checkCloset();
      toast({
        title: 'Item added',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error adding item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`/api/user/closet/item/${itemId}`);
      checkCloset();
      toast({
        title: 'Item deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error deleting item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (hasCloset === null) {
    return <Box p={8}>Loading...</Box>;
  }

  return (
    <Box p={8}>
      <Heading mb={4}>My Closet</Heading>
      {!hasCloset ? (
        <VStack spacing={4} align="stretch">
          <Text>You don't have a closet yet.</Text>
          <Button onClick={createCloset} colorScheme="blue">Create Closet</Button>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <Text>Your closet has been created.</Text>
          <FormControl>
            <FormLabel>Upload a new item</FormLabel>
            <HStack>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button onClick={addItem} colorScheme="green" isDisabled={!selectedFile}>
                Add Item
              </Button>
            </HStack>
          </FormControl>
          {closetItems.map((item) => (
            <HStack key={item.id} justify="space-between">
              <Text>{item.category} - {item.subcategory} ({item.color})</Text>
              <Button onClick={() => deleteItem(item.id)} colorScheme="red" size="sm">Delete</Button>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default Closet;
