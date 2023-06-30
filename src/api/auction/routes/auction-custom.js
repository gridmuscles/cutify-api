'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auctions/:id/bids',
      handler: 'auction.createAuctionBid',
      policies: [
        { name: 'global::captcha', config: { action: 'AUCTION_DO_BID' } },
      ],
    },
    {
      method: 'GET',
      path: '/auctions/:id/bids/latest',
      handler: 'auction.findAuctionLatestBid',
      config: {
        middlewares: [{ name: 'global::populate', config: { deep: 1 } }],
      },
    },
  ],
}
