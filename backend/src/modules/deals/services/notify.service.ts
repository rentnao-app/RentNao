import { db } from '@/db/client';
import { createNotification } from '@/modules/notifications/notifications.service';

/**
 * Notification context for a rent deed event.
 * Fetched from the DB so we never rely on caller-supplied PII.
 */
interface DeedParticipants {
  tenantUserId: string;
  ownerUserId: string;
  tenantName: string;
  ownerName: string;
  propertyTitle: string;
  flatNo: string | null;
}

/**
 * Fetches the tenant and owner details for a deal from the database.
 * Returns null if the deal or its participants cannot be resolved.
 */
async function fetchDeedParticipants(dealId: string): Promise<DeedParticipants | null> {
  const result = await db.query(
    `SELECT
       d.tenant_id,
       d.owner_id,
       p.title        AS property_title,
       p.flat_no,
       COALESCE(
         TRIM(CONCAT(tp.first_name, ' ', tp.last_name)),
         'Tenant'
       ) AS tenant_name,
       COALESCE(
         TRIM(CONCAT(op.first_name, ' ', op.last_name)),
         'Owner'
       ) AS owner_name
     FROM "Deal" d
     JOIN "Property" p ON p.property_id = d.property_id
     LEFT JOIN "BaseUserProfile" tp ON tp.user_id = d.tenant_id
     LEFT JOIN "BaseUserProfile" op ON op.user_id = d.owner_id
     WHERE d.deal_id = $1`,
    [dealId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    tenantUserId: row.tenant_id,
    ownerUserId: row.owner_id,
    tenantName: row.tenant_name || 'Tenant',
    ownerName: row.owner_name || 'Owner',
    propertyTitle: row.property_title || 'Property',
    flatNo: row.flat_no ?? null,
  };
}

/**
 * Sends in-app notifications (with real-time WebSocket push) to both
 * the tenant and the owner after a rent deed has been generated.
 *
 * This function is intentionally fire-and-forget safe — notification
 * failures are logged but never propagated to the caller so they do
 * not break the main rent-deed generation flow.
 *
 * @param dealId  - The deal ID (used to look up participants)
 * @param pdfUrl  - The short-lived presigned download URL for the deed
 */
export async function notifyTenant(dealId: string, pdfUrl: string): Promise<void> {
  // -- Input validation --
  if (!dealId || typeof dealId !== 'string') {
    console.error('[Notify Service] Invalid dealId — skipping notifications');
    return;
  }

  if (!pdfUrl || typeof pdfUrl !== 'string') {
    console.error('[Notify Service] Invalid pdfUrl — skipping notifications');
    return;
  }

  let participants: DeedParticipants | null = null;

  try {
    participants = await fetchDeedParticipants(dealId);
  } catch (err: any) {
    console.error('[Notify Service] Failed to fetch deal participants:', {
      dealId,
      error: err?.message,
    });
    return;
  }

  if (!participants) {
    console.warn(`[Notify Service] No deal found for dealId=${dealId} — skipping notifications`);
    return;
  }

  const { tenantUserId, ownerUserId, tenantName, ownerName, propertyTitle, flatNo } = participants;
  const locationLabel = flatNo ? `${propertyTitle} (Flat ${flatNo})` : propertyTitle;

  // Notification metadata attached to both notifications
  const notificationData = {
    type: 'RENT_DEED_GENERATED',
    dealId,
    pdfUrl,
  };

  // -- Notify the tenant --
  try {
    await createNotification(
      tenantUserId,
      'Rent Deed Ready',
      `Your rent deed for ${locationLabel} has been generated. Download it from your dashboard.`,
      notificationData
    );
    console.log(
      `[Notify Service] Tenant notification sent: userId=${tenantUserId}, deal=${dealId}`
    );
  } catch (err: any) {
    console.error('[Notify Service] Failed to notify tenant:', {
      tenantUserId,
      dealId,
      error: err?.message,
    });
  }

  // -- Notify the owner --
  try {
    // Do not notify the owner about themselves if they are also the tenant
    // (edge case: shouldn't happen in production but defensively handled)
    if (ownerUserId === tenantUserId) {
      console.log('[Notify Service] Owner is same as tenant — skipping duplicate notification');
      return;
    }

    await createNotification(
      ownerUserId,
      'Rent Deed Sent',
      `The rent deed for ${locationLabel} has been generated and sent to ${tenantName}.`,
      notificationData
    );
    console.log(`[Notify Service] Owner notification sent: userId=${ownerUserId}, deal=${dealId}`);
  } catch (err: any) {
    console.error('[Notify Service] Failed to notify owner:', {
      ownerUserId,
      dealId,
      error: err?.message,
    });
  }
}
