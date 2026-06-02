import type { OpenAPIHono } from '@hono/zod-openapi';
import { generateRentDeedRoute } from '../routes/deals.routes';
import { compileDeedTemplate } from '../services/template.service.ts';
import { generatePdf } from '../services/pdf.service.ts';
import { uploadDeedToStorage } from '../services/storage.service.ts';
import { notifyTenant } from '../services/notify.service.ts';
import { db } from '@/db/client';
import { AppError } from '@/errors/base';

export function registerDealsRoutes(app: OpenAPIHono) {
  app.openapi(generateRentDeedRoute, async (c) => {
    const { dealId } = c.req.valid('param');
    const user = c.get('user');

    // Fetch deal to authorize
    const dealResult = await db.query('SELECT owner_id, tenant_id FROM "Deal" WHERE deal_id = $1', [dealId]);
    
    if (dealResult.rowCount === 0) {
      throw new AppError(404, 'Deal not found');
    }

    const deal = dealResult.rows[0];

    const isOwner = user.userId === deal.owner_id;
    const isTenant = user.userId === deal.tenant_id;

    // The user must be EITHER the owner OR the tenant to proceed
    if (!isOwner && !isTenant) {
      throw new AppError(403, 'You are not authorized to access this rent deed');
    }

    // 1. Fetch DB data and compile the HTML
    const htmlContent = await compileDeedTemplate(dealId);

    // 2. Generate PDF via Puppeteer
    const pdfBuffer = await generatePdf(htmlContent);

    // 3. Upload to AWS S3
    const pdfUrl = await uploadDeedToStorage(dealId, pdfBuffer);

    // 4. Send Email/SMS to Tenant
    await notifyTenant(dealId, pdfUrl);

    return c.json({
      success: true,
      data: { pdfUrl }
    }, 201);
  });
}
