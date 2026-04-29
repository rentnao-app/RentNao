/**
 * Wallet controller
 * Handles wallet route handlers
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from '../routes';
import * as services from '../services';

/**
 * Register wallet routes
 */
export function registerWalletRoutes(app: OpenAPIHono) {
  // GET /wallet
  app.openapi(routes.getWalletRoute, async (c) => {
    const user = c.get('user');
    const wallet = await services.getWalletAccount(user.userId);
    return c.json({
      success: true,
      data: wallet,
    });
  });

  // GET /wallet/transactions
  app.openapi(routes.getTransactionsRoute, async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');
    const page = query.page || 1;
    const limit = query.limit || 20;

    const result = await services.getWalletTransactions(user.userId, page, limit);
    return c.json({
      success: true,
      data: result,
    });
  });


  // GET /wallet/charges
  app.openapi(routes.getChargesRoute, async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');
    const page = query.page || 1;
    const limit = query.limit || 20;

    const result = await services.getUserCharges(user.userId, page, limit);
    return c.json({
      success: true,
      data: result,
    });
  });

  // POST /wallet/topup
  app.openapi(routes.createTopupRoute, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const topupRequest = await services.createTopupRequest(
      user.userId,
      body.amount,
      body.bkashNumber,
      body.transactionId
    );

    return c.json(
      {
        success: true,
        data: topupRequest,
      },
      201
    );
  });

  // GET /wallet/topup
  app.openapi(routes.getUserTopupRequestsRoute, async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');
    const page = query.page || 1;
    const limit = query.limit || 20;

    const result = await services.getUserTopupRequests(user.userId, page, limit);
    return c.json({
      success: true,
      data: result,
    });
  });

}
