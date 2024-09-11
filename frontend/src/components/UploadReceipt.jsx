import React, { useState } from 'react';
import AWS from 'aws-sdk';
import { Box, Button, Input, Progress, VStack, Text, useToast } from '@chakra-ui/react';

const S3_BUCKET = 'grocery-receipts-bucket';
const REGION = 'us-east-1';

AWS.config.update({
  region: REGION,
  accessKeyId: "",
  secretAccessKey: "",
  sessionToken: ""
});

const myBucket = new AWS.S3();

const UploadReceipt = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleFileInput = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadFile = (file) => {
    const params = {
      ACL: 'public-read',
      Body: file,
      Bucket: S3_BUCKET,
      Key: file.name,
    };

    myBucket.upload(params)
      .on('httpUploadProgress', (evt) => {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      })
      .send((err) => {
        if (err) {
          console.log(err);
          toast({
            title: 'Error uploading file.',
            description: err.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } else {
          console.log('Successfully uploaded file.');
          toast({
            title: 'File uploaded successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      });
  };

  return (
    <VStack spacing={4} mt={10}>
      <Text fontSize="2xl" fontWeight="bold">Upload Your Grocery Receipt</Text>
      <Input type="file" onChange={handleFileInput} />
      <Button colorScheme="blue" onClick={() => uploadFile(selectedFile)} disabled={!selectedFile}>
        Upload to S3
      </Button>
      {progress > 0 && (
        <Progress value={progress} size="sm" width="100%" colorScheme="green" />
      )}
    </VStack>
  );
};

export default UploadReceipt;
