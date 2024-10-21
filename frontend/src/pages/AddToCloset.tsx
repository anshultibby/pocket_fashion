import React, { useState } from 'react';
import { Box, Heading, VStack, Text, Input, Button, InputProps } from '@chakra-ui/react';
import { useDropzone, DropzoneInputProps } from 'react-dropzone';
import axios from 'axios';

const AddToCloset: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Filter out incompatible props
  const inputProps: InputProps = Object.fromEntries(
    Object.entries(getInputProps()).filter(([key]) => 
      !['size', 'accept', 'multiple'].includes(key)
    )
  ) as InputProps;

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadedFile);

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
      setUploadedFile(null);
    }
  };

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
          cursor="pointer"
        >
          <Input {...inputProps} />
          {isDragActive ? (
            <Text>Drop the files here ...</Text>
          ) : (
            <Text>Add files</Text>
          )}
        </Box>
        {uploadedFile && (
          <Text>Selected file: {uploadedFile.name}</Text>
        )}
        <Button
          onClick={handleUpload}
          isLoading={uploading}
          loadingText="Uploading..."
          isDisabled={!uploadedFile}
        >
          Upload
        </Button>
      </VStack>
    </Box>
  );
};

export default AddToCloset;
