import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, VStack, HStack, Input, useToast, FormControl, FormLabel, SimpleGrid, Image } from '@chakra-ui/react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDropzone, Accept } from 'react-dropzone';

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
  const { isAuthenticated } = useAuth();
  const [closetItems, setClosetItems] = useState<Clothes[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchClosetItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/user/closet');
      setClosetItems(response.data.items || []);
      console.log('Fetched closet items:', response.data.items);
    } catch (error) {
      console.error('Error fetching closet items:', error);
      toast({
        title: 'Error fetching closet items',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const accept: Accept = {
    'image/*': []
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(event.target.files as FileList)]);
    }
  };

  const addItems = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await api.post('/api/user/closet/item', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data && response.data.item) {
          setClosetItems(prev => [...prev, response.data.item]);
          console.log('Added item:', response.data.item);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Error adding item:', error);
        toast({
          title: `Error adding item: ${file.name}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }

    setSelectedFiles([]);
    toast({
      title: 'Items added successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`/api/user/closet/item/${itemId}`);
      setClosetItems(closetItems.filter(item => item.id !== itemId));
      console.log('Deleted item:', itemId);
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

  if (isLoading) {
    return <Box p={8}>Loading...</Box>;
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <FormControl>
          <FormLabel>Add new items to your closet</FormLabel>
          <VStack spacing={4} align="stretch">
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
              {isDragActive ? (
                <Text>Drop the files here ...</Text>
              ) : (
                <Text>Drag 'n' drop some files here, or click to select files</Text>
              )}
            </Box>
            <HStack>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                multiple
              />
              <Button onClick={addItems} colorScheme="green" isDisabled={selectedFiles.length === 0}>
                Add Items
              </Button>
            </HStack>
            {selectedFiles.length > 0 && (
              <Text>{selectedFiles.length} file(s) selected</Text>
            )}
          </VStack>
        </FormControl>

        {closetItems.length > 0 ? (
          <SimpleGrid columns={[2, 3, 4]} spacing={4}>
            {closetItems.map((item) => (
              <Box key={item.id} borderWidth={1} borderRadius="lg" overflow="hidden">
                <Image
                  className="image-container"
                  src={`${process.env.REACT_APP_API_URL}${item.image_path}`}
                  alt={`${item.category} - ${item.subcategory}`}
                  objectFit="cover"
                  width="100%"
                  height="200px"
                  fallbackSrc="/path/to/fallback/image.jpg"
                  onError={(e) => {
                    console.error('Error loading image:', e);
                    console.log('Failed image path:', `${process.env.REACT_APP_API_URL}${item.image_path}`);
                  }}
                  onLoad={() => console.log('Image loaded:', `${process.env.REACT_APP_API_URL}${item.image_path}`)}
                />
                <Box p={2}>
                  <Text fontSize="sm">{item.category} - {item.subcategory}</Text>
                  <Text fontSize="xs" color="gray.500">{item.color}</Text>
                  <Button onClick={() => deleteItem(item.id)} size="xs" colorScheme="red" mt={2}>
                    Delete
                  </Button>
                </Box>
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