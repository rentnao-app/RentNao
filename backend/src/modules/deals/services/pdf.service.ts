import puppeteer, { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  console.log('[PDF Service] Launching shared headless browser instance');
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-local-file-access',
      '--disable-extensions',
      '--disable-dev-shm-usage',
    ],
  });

  browserInstance.on('disconnected', () => {
    console.log('[PDF Service] Shared browser disconnected.');
    browserInstance = null;
  });

  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function generatePdf(htmlContent: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Enable request interception before setting content to prevent SSRF
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.startsWith('data:') ||
        url.startsWith('https://fonts.googleapis.com/') ||
        url.startsWith('https://fonts.gstatic.com/')
      ) {
        request.continue();
      } else {
        console.warn(`[PDF Service Security Alert] Blocked outbound request to: ${url}`);
        request.abort();
      }
    });

    await page.setContent(htmlContent, {
      waitUntil: 'load',
      timeout: 10000,
    });

    await page.evaluate(async () => {
      await (globalThis as any).document.fonts.ready;
    });

    console.log('[PDF Service] Rendering A4 PDF');
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px',
      },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await page.close();
    console.log('[PDF Service] Page session closed.');
  }
}
