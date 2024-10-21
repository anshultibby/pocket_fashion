import React, { useState, useEffect, useCallback } from 'react';
import { Box, VStack, Text, Input, Button, InputProps, SimpleGrid, Image, Flex, IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useDropzone, DropzoneInputProps } from 'react-dropzone';
import axios from 'axios';

interface FileWithPreview extends File {
  preview: string;
}

const AddToCloset: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreviews = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );
    setUploadedFiles(prevFiles => [...prevFiles, ...filesWithPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop, 
    noClick: true,
    multiple: true,
    accept: {
      'image/*': []
    }
  });

  // Filter out incompatible props
  const inputProps: InputProps = Object.fromEntries(
    Object.entries(getInputProps()).filter(([key]) => 
      !['size', 'accept', 'multiple'].includes(key)
    )
  ) as InputProps;

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    uploadedFiles.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Upload successful:', response.data);
      // You might want to add some user feedback here
    } catch (error) {
      console.error('Upload failed:', error);
      // You might want to add some error handling here
    } finally {
      setUploading(false);
      setUploadedFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const cancelAll = () => {
    setUploadedFiles([]);
  };

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [uploadedFiles]);

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box
          {...getRootProps()}
          borderWidth={2}
          borderStyle="dashed"
          borderRadius="md"
          p={4}
          textAlign="center"
        >
          <Input {...inputProps} />
          {isDragActive ? (
            <Text>Drop the images here ...</Text>
          ) : (
            <Button onClick={open}>Select Images</Button>
          )}
        </Box>
        {uploadedFiles.length > 0 && (
          <SimpleGrid columns={[2, 3, 4]} spacing={1}>
            {uploadedFiles.map((file, index) => (
              <Box key={index} position="relative" width="100%" paddingBottom="100%">
                <Box position="absolute" top={0} left={0} right={0} bottom={0}>
                  <Image 
                    src={file.preview} 
                    alt={file.name} 
                    objectFit="contain"
                    width="100%"
                    height="100%"
                  />
                  <IconButton
                    aria-label="Remove image"
                    icon={<CloseIcon boxSize={3} />}
                    size="xs"
                    position="absolute"
                    top={0}
                    right={0}
                    onClick={() => removeFile(index)}
                    zIndex={1}
                    bg="rgba(0, 0, 0, 0.5)"
                    color="white"
                    _hover={{ bg: "rgba(0, 0, 0, 0.7)" }}
                    minWidth="20px"
                    height="20px"
                    padding={0}
                  />
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
        <Flex justifyContent="space-between">
          <Button
            onClick={handleUpload}
            isLoading={uploading}
            loadingText="Uploading..."
            isDisabled={uploadedFiles.length === 0}
            colorScheme="blue"
          >
            Upload {uploadedFiles.length} image{uploadedFiles.length !== 1 ? 's' : ''}
          </Button>
          <Button
            onClick={cancelAll}
            isDisabled={uploadedFiles.length === 0}
            variant="outline"
            colorScheme="red"
          >
            Cancel All
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default AddToCloset;
