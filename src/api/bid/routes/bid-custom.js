'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/bids/auction/:auctionId',
      handler: 'bid.createAuctionBid',
      policies: [
        { name: 'global::captcha', config: { action: 'AUCTION_DO_BID' } },
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
    {
      method: 'GET',
      path: '/bids/auction/:auctionId/latest',
      handler: 'bid.findAuctionLatestBid',
      config: {
        policies: [
          { name: 'global::query', config: { allowedParams: ['locale'] } },
        ],
      },
    },
  ],
}
