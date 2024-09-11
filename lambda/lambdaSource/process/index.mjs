import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const s3Client = new S3Client({ region: 'us-east-1' });
const textractClient = new TextractClient({ region: 'us-east-1' });
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

const extractData = (blocks) => {
  const products = [];
  let placeBought = '';
  let currentProduct = null;

  const placePattern = /costco|walmart|supermarket|wholesale|mart/i;
  const pricePattern = /^\d+\.\d{2}$/;

  blocks.forEach((block) => {
    if (block.BlockType === 'LINE') {
      const text = block.Text.trim();
      console.log("Processing text:", text);

      // Check if the line contains place information
      if (placePattern.test(text.toLowerCase())) {
        placeBought = block.Text;
      } else if (pricePattern.test(text)) {
        // If the current line is a price, associate it with the previous line (product name)
        const price = parseFloat(text);
        if (currentProduct) {
          products.push({ productName: currentProduct, price: price });
          currentProduct = null; // Reset current product after associating price
        }
      } else {
        // If it's a product name, store it as the current product
        currentProduct = text;
      }
    }
  });

  console.log("Products and Prices Extracted:", JSON.stringify(products));
  console.log("Place Bought:", placeBought);

  return { products, placeBought };
};

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    // Get the object from S3
    const getObjectParams = {
      Bucket: bucket,
      Key: key,
    };

    let s3Response;
    try {
      s3Response = await s3Client.send(new GetObjectCommand(getObjectParams));
    } catch (err) {
      console.error(`Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`);
      throw err;
    }

    const fileContent = await streamToBuffer(s3Response.Body);

    // Analyze the document using Textract
    const textractParams = {
      Document: {
        Bytes: fileContent,
      },
      FeatureTypes: ['FORMS'],
    };

    let textractResponse;
    try {
      textractResponse = await textractClient.send(new AnalyzeDocumentCommand(textractParams));
    } catch (textractError) {
      console.error(`Textract error: ${textractError}`);
      throw textractError;
    }

    console.log("Textract Response Blocks:", JSON.stringify(textractResponse.Blocks));

    const { products, placeBought } = extractData(textractResponse.Blocks);

    const timestamp = new Date().toISOString();

    // Store all products in one DynamoDB item
    const putItemParams = {
      TableName: 'ReceiptsData',
      Item: {
        ReceiptID: { S: key },
        Products: { L: products.map(product => ({ M: { productName: { S: product.productName }, price: { N: product.price.toString() } } })) },
        PlaceBought: { S: placeBought },
        Timestamp: { S: timestamp },
      },
    };

    try {
      console.log("Storing in DynamoDB:", JSON.stringify(putItemParams));
      await dynamoDbClient.send(new PutItemCommand(putItemParams));
    } catch (dynamoDbError) {
      console.error(`DynamoDB error: ${dynamoDbError}`);
      throw dynamoDbError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify('Receipt processed successfully!'),
    };
  } catch (error) {
    console.error(`General error: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify('Error processing receipt.'),
    };
  }
};
