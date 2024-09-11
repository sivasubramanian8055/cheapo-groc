import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

const stores = [
  {
    name: 'Atlantic Superstore',
    url: 'https://www.atlanticsuperstore.ca/print-flyer',
    iframeSelector: 'iframe.mainframe', 
    itemSelector: 'a'
  },
  {
    name: 'Giant Tiger',
    url: 'https://www.gianttiger.com/collections/flyers-and-deals?view=flyers',
    iframeSelector: 'iframe.mainframe',
    itemSelector: 'a' 
  },
  {
    name: 'No Frills',
    url: 'https://www.nofrills.ca/print-flyer',
    iframeSelector: 'iframe.mainframe',
    itemSelector: 'button'
  },
  {
    name: 'Wholesale club',
    url: 'https://www.wholesaleclub.ca/print-flyer',
    iframeSelector: 'iframe.mainframe',
    itemSelector: 'a' 
  },
];

export const handler = async (event) => {
  let browser = null;

  try {
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36"',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.atlanticsuperstore.ca', ['geolocation']);

    const page = await browser.newPage();

    let allItems = [];

    for (const store of stores) {
      const { name, url, iframeSelector, itemSelector } = store;

      await page.goto(url, { waitUntil: 'networkidle2' });

      // Wait for the iframe to be present
      await page.waitForSelector(iframeSelector);
      console.log(`Found iframe for ${name}`);

      const iframeElement = await page.$(iframeSelector);
      const iframe = await iframeElement.contentFrame();

      // Wait for the content inside the iframe to load
      await iframe.waitForSelector(itemSelector);
      console.log(`Content loaded inside iframe for ${name}`);

      // Scroll to the bottom of the iframe to trigger lazy loading
      await autoScroll(iframe);

      const items = await iframe.$$eval(itemSelector, elements =>
        elements.map(elem => {
          const ariaLabel = elem.getAttribute('aria-label');
          if (ariaLabel) {
            const parts = ariaLabel.split(', ');
            return { productName: parts[0].trim(), offer: parts.slice(1).join(', ').trim(), storeName: name };
          }
          return null;
        }).filter(item => item !== null)
      );

      allItems = allItems.concat(items);
    }

    const putItemParams = {
      TableName: 'FlyersData',
      Item: {
        flyerId: { S: `${Date.now()}-${Math.floor(Math.random() * 10000)}` },  // Generate a unique ID using timestamp and random number
        Date: { S: new Date().toISOString().split('T')[0] },
        Items: { L: allItems.map(item => ({ M: { productName: { S: item.productName }, offer: { S: item.offer }, storeName: { S: item.storeName } } })) }
      }
    };

    await dynamoDbClient.send(new PutItemCommand(putItemParams));

    return {
      statusCode: 200,
      body: JSON.stringify('Flyers scraped and saved successfully!')
    };
  } catch (error) {
    console.error('Error scraping flyers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error scraping flyers.')
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

async function autoScroll(frame) {
  await frame.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
