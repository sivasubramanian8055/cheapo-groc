import React from 'react';
import { ChakraProvider, Container, VStack } from '@chakra-ui/react';
import theme from './theme';
import SearchProducts from './components/SearchProduct';
import UploadReceipt from './components/UploadReceipt';


function App() {
  return (
    <ChakraProvider theme={theme}>
      <Container maxW="container.md" py={10}>
        <VStack spacing={10}>
          <SearchProducts />
          <UploadReceipt />
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App;
