'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auctions/:id/bids',
      handler: 'auction.createAuctionBid',
    },
    {
      method: 'GET',
      path: '/auctions/:id/bids/latest',
      handler: 'auction.findAuctionLatestBid',
      config: {
        middlewares: [{ name: 'global::populate', config: { deep: 1 } }],
      },
    },
    {
      method: 'POST',
      path: '/auctions/:id/complete',
      handler: 'auction.completeAuction',
      config: {
        middlewares: [{ name: 'global::populate', config: { deep: 2 } }],
      },
    },
  ],
}
