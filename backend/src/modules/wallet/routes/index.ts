export {
  getWalletRoute,
  getTransactionsRoute,
  getChargesRoute,
  getActiveFeeRoute,
  createTopupRoute,
  getUserTopupRequestsRoute,
} from './wallet.routes';

export function getTopupRoute(getTopupRoute: any, arg1: (c: Context<any, any, any>) => Promise<Response & TypedResponse<any, ContentfulStatusCode, "json">>) {
  throw new Error('Function not implemented.');
}

export function getActiveFeeRoute(getActiveFeeRoute: any, arg1: (c: Context<any, any, any>) => Promise<Response & TypedResponse<any, ContentfulStatusCode, "json">>) {
  throw new Error('Function not implemented.');
}

export function bkashWebhookRoute(bkashWebhookRoute: any, arg1: (c: Context<any, any, any>) => Promise<Response & TypedResponse<{ success: true; message: string; }, ContentfulStatusCode, "json">>) {
  throw new Error('Function not implemented.');
}
