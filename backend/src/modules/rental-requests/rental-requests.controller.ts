import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  acceptRoute,
  createRentalRequestRoute,
  deleteRequestRoute,
  listIncomingRoute,
  listMineRoute,
  myStatusRoute,
  rejectRoute,
  withdrawRoute,
} from './rental-requests.routes';
import {
  acceptRentalRequest,
  createRentalRequest,
  deleteRentalRequestByOwner,
  listIncomingForOwner,
  listMyRentalRequests,
  myRequestStatusForListing,
  rejectRentalRequest,
  withdrawRentalRequest,
} from './rental-requests.service';

export function registerRentalRequestRoutes(app: OpenAPIHono) {
  app.openapi(createRentalRequestRoute, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const { request_id } = await createRentalRequest(user.userId, user.role, body.listingId, body.message);
    return c.json({ success: true, data: { request_id }, message: 'Rental request sent' }, 201);
  });

  app.openapi(listMineRoute, async (c) => {
    const user = c.get('user');
    const requests = await listMyRentalRequests(user.userId, user.role);
    return c.json({ success: true, data: { requests } }, 200);
  });

  app.openapi(listIncomingRoute, async (c) => {
    const user = c.get('user');
    const requests = await listIncomingForOwner(user.userId, user.role);
    return c.json({ success: true, data: { requests } }, 200);
  });

  app.openapi(myStatusRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');
    const status = await myRequestStatusForListing(user.userId, user.role, listingId);
    return c.json({ success: true, data: status }, 200);
  });

  app.openapi(withdrawRoute, async (c) => {
    const user = c.get('user');
    const { requestId } = c.req.valid('param');
    await withdrawRentalRequest(user.userId, user.role, requestId);
    return c.json({ success: true }, 200);
  });

  app.openapi(acceptRoute, async (c) => {
    const user = c.get('user');
    const { requestId } = c.req.valid('param');
    await acceptRentalRequest(user.userId, user.role, requestId);
    return c.json({ success: true }, 200);
  });

  app.openapi(rejectRoute, async (c) => {
    const user = c.get('user');
    const { requestId } = c.req.valid('param');
    await rejectRentalRequest(user.userId, user.role, requestId);
    return c.json({ success: true }, 200);
  });

  app.openapi(deleteRequestRoute, async (c) => {
    const user = c.get('user');
    const { requestId } = c.req.valid('param');
    await deleteRentalRequestByOwner(user.userId, user.role, requestId);
    return c.json({ success: true }, 200);
  });
}
