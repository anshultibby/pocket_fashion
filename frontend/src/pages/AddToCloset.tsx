import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, VStack, Text, Button, SimpleGrid, Image, Flex, IconButton, useToast, Input, HStack } from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// At the top of your file, after the imports
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'; // Adjust this URL as needed

interface FileWithPreview extends File {
  preview: string;
}

const AddToCloset: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => 
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  useEffect(() => {
    // Clean up the file previews when the component unmounts
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload items.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please select files to upload.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append(`images`, file);
    });

    try {
      const response = await api.post('/api/user/closet/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.added_items.length > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully added ${response.data.added_items.length} item${response.data.added_items.length !== 1 ? 's' : ''} to closet`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
      
      if (response.data.failed_items.length > 0) {
        toast({
          title: "Upload Partially Failed",
          description: `Failed to add ${response.data.failed_items.length} item${response.data.failed_items.length !== 1 ? 's' : ''} to closet`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your images. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadedFiles([]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCancelUpload = () => {
    setUploadedFiles([]);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box 
        {...getRootProps()} 
        p={6} 
        border="2px dashed" 
        borderColor="gray.300" 
        borderRadius="md"
        textAlign="center"
        cursor="pointer"
      >
        <input {...getInputProps()} />
        <AddIcon boxSize={8} color="gray.500" />
        <Text mt={2}>Click or drag files to upload</Text>
      </Box>
      
      <Input
        type="file"
        multiple
        onChange={(e) => onDrop(Array.from(e.target.files || []))}
        hidden
        ref={fileInputRef}
      />

      {uploadedFiles.length > 0 && (
        <VStack spacing={4}>
          <Text fontWeight="bold">Selected Files ({uploadedFiles.length})</Text>
          <SimpleGrid columns={3} spacing={4}>
            {uploadedFiles.map((file, index) => (
              <Box key={index} position="relative">
                <Image src={file.preview} alt={file.name} borderRadius="md" />
                <IconButton
                  aria-label="Remove image"
                  icon={<CloseIcon />}
                  size="sm"
                  position="absolute"
                  top={1}
                  right={1}
                  onClick={() => handleRemoveFile(index)}
                />
              </Box>
            ))}
          </SimpleGrid>
          <HStack spacing={4} width="100%">
            <Button 
              onClick={handleCancelUpload} 
              colorScheme="red" 
              variant="outline" 
              flex={1}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              isLoading={uploading} 
              loadingText="Uploading..." 
              colorScheme="blue" 
              flex={1}
            >
              Upload to Closet
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default AddToCloset;
