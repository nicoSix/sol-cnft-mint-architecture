# sol-cnft-mint-architecture

<i>A clean architecture to mint Solana compressed NFTs at blazing-fast speeds!</i>

In this repository, I am trying to build a dummy project that allows creating collections and minting compressed NFTs on Solana, using [Bubblegum](https://developers.metaplex.com/bubblegum).

One goal of this project is to propose a clean architecture around these two features, by decoupling blockchain operations from the API using a [RabbitMQ](rabbitmq.com) queue and a dedicated service.

<b>Note: this project is not suited for production purposes. Only use it as a learning example or for development purposes.</b>

## Credits

- [cMint transaction event log extractor (to retrieve leaf id) by @nickfrosty](https://github.com/solana-labs/solana-program-library/pull/4658)
- [cNFTs methods (mint, create collection, etc.) by @solana-developers](https://github.com/solana-developers/compressed-nfts/tree/master)