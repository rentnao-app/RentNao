import puppeteer from 'puppeteer';

export async function generatePdf(htmlContent: string): Promise<Buffer> {
  console.log('[PDF Service] Launching headless browser');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-local-file-access'],
  });

  try {
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, {
      waitUntil: 'load',
    });

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
    await browser.close();
    console.log('[PDF Service] Browser session closed.');
  }
}
