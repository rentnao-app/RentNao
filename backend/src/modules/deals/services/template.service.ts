import fs from 'fs/promises';
import path from 'path';
import { db } from '@/db/client';
import { AppError } from '@/errors/base';

// Prevent XSS in Puppeteer-rendered HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function compileDeedTemplate(dealId: string): Promise<string> {
  // Fetch all deed variables in a single query
  const result = await db.query(
    `SELECT
       -- Property
       p.floor_no_bn,
       p.flat_no_bn,
       p.flat_no,

       -- Owner
       owner_prof.full_name_bn  AS owner_name_bn,
       owner_prof.religion_bn   AS owner_religion_bn,
       owner_prof.profession_bn AS owner_profession_bn,
       owner_prof.nid_bn        AS owner_nid_bn,
       owner_prof.phone_bn      AS owner_mobile_bn,

       -- Tenant 
       tenant_prof.full_name_bn  AS tenant_name_bn,
       tenant_prof.religion_bn   AS tenant_religion_bn,
       tenant_prof.profession_bn AS tenant_profession_bn,
       tenant_prof.nid_bn        AS tenant_nid_bn,
       tenant_prof.phone_bn      AS tenant_mobile_bn

     FROM "Deal" d
     JOIN "Property" p ON p.property_id = d.property_id
     LEFT JOIN "BaseUserProfile" owner_prof  ON owner_prof.user_id  = d.owner_id
     LEFT JOIN "BaseUserProfile" tenant_prof ON tenant_prof.user_id = d.tenant_id
     WHERE d.deal_id = $1`,
    [dealId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Deal not found');
  }

  const row = result.rows[0];

  // Build variable map 
  const variables: Record<string, string> = {
    // Property
    floor_level_bn: row.floor_no_bn ?? '',
    flat_no_bn: row.flat_no_bn ?? '',
    flat_no_en: row.flat_no ?? '',

    // Owner
    owner_name_bn: row.owner_name_bn ?? '',
    owner_religion_bn: row.owner_religion_bn ?? '',
    owner_profession_bn: row.owner_profession_bn ?? '',
    owner_nid_bn: row.owner_nid_bn ?? '',
    owner_mobile_bn: row.owner_mobile_bn ?? '',

    // Tenant
    tenant_name_bn: row.tenant_name_bn ?? '',
    tenant_religion_bn: row.tenant_religion_bn ?? '',
    tenant_profession_bn: row.tenant_profession_bn ?? '',
    tenant_nid_bn: row.tenant_nid_bn ?? '',
    tenant_mobile_bn: row.tenant_mobile_bn ?? '',
    tenant_nationality_bn: 'বাংলাদেশী',
  };

  // Read and compile the HTML template 
  const templatePath = path.join(__dirname, '../templates/rent-deed/rent_deed.html');
  const cssPath = path.join(__dirname, '../templates/rent-deed/rent_deed.css');
  const imagePath = path.join(__dirname, '../templates/rent-deed/Picture1.png');

  let html = await fs.readFile(templatePath, 'utf-8');
  const css = await fs.readFile(cssPath, 'utf-8');
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Inline CSS
  html = html.replace(
    '<link rel="stylesheet" href="rent_deed.css">',
    `<style>${css}</style>`
  );

  // Inline Stamp Image (Base64)
  html = html.replaceAll(
    'src="Picture1.png"',
    `src="data:image/png;base64,${base64Image}"`
  );

  // Replace all {{variable}} placeholders (HTML-escaped)
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, escapeHtml(value));
  }

  html = html.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  
  return html;
}
