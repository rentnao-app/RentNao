/**
 * Sends notifications (Email/SMS) to the tenant with the rent deed attached or linked.
 */
export async function notifyTenant(dealId: string, pdfUrl: string): Promise<void> {
  // TODO: Fetch tenant contact details from DB using dealId
  // TODO: Send Email / SMS
  console.log(`Notifying tenant for deal ${dealId}. Deed available at: ${pdfUrl}`);
}
