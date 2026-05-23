/**
 * Wallet module
 * Handles all wallet operations: account, transactions, topups, charges
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerWalletRoutes } from './controllers';

const wallet = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Protect user-facing wallet APIs; keep provider callback endpoint public.
wallet.use('/', requireAuth);
wallet.use('/transactions', requireAuth);
wallet.use('/topup', requireAuth);
wallet.use('/topup/*', requireAuth);
wallet.use('/charges', requireAuth);
wallet.use('/fees/*', requireAuth);

registerWalletRoutes(wallet);

export default wallet;