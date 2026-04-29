/**
 * Wallet module
 * Handles all wallet operations: account, transactions, charges, topup
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerWalletRoutes } from './controllers';

const wallet = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Protect user-facing wallet APIs
wallet.use('/', requireAuth);
wallet.use('/transactions', requireAuth);
wallet.use('/charges', requireAuth);
wallet.use('/topup', requireAuth);

registerWalletRoutes(wallet);

export default wallet;
