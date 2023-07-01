'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auctions/:auctionId/complete',
      handler: 'auction.completeAuction',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [{ name: 'global::query', config: { allowedParams: [] } }],
      },
    },
    {
      method: 'POST',
      path: '/auctions/:auctionId/verify',
      handler: 'auction.verifyAuction',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [{ name: 'global::query', config: { allowedParams: [] } }],
      },
    },
  ],
}
