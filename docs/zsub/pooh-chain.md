##  pooh-geth
## Betelgeuse
### Deploying WETH, Multicall based on localnet
Deploy contracts
```
cp .env.sample .env
cd ~/work/smart-contracts/betelgeuse
yarn deploy:localnet
```

The results are as follows. Copy them to `.env`.
```
CONDUIT_CONTROLLER_ADDRESS=0x38e0e626aE48A19beA89880E3EAc65Bdd620EAa3
CONDUIT_ADDRESS=0x1Fc4FE9233F8Cd9E0cf29f37C99B5D7B3b0faeE4
CONDUIT_KEY=0x1811DfdE14b2e9aBAF948079E8962d200E71aCFD000000000000000000000000
SEAPORT_ADDRESS=0x39E1F7e473DEF5911a81133d8Ef5c5bfBdFC2CA6
ASSET_CONTRACT_SHARED_ADDRESS=0xaFEBcc4491055DAF6f3211d917f80212931819d2
LAZY_MINT_ADAPTER_ADDRESS=0x171318B8700CD5A8160fc282F975b89346D91C16
SPIDER_VERSE_NFT_LAST_COMBINE_TOKEN_ID=0xc559c7d0c3851140185900d223b7fe531e8823a80000000000000100000f4240
WETH_ADDRESS=0x22B00b28fd16097533a83E37BCaD337D63aE6ef3
MULTICALL_ADDRESS=0x5a6B4111218761e19B5EdA036147eF746Da734E1
```

Run test trades and review
```
yarn trade:localnet
yarn check:trade:localnet
```

### Running backend
```
mkdir temp_image
cp .env.example .env
```

Copy the next to `.env`
```
RPC_URL=http://localhost:8585
ASSET_CONTRACT_SHARED_ADDRESS=0xaFEBcc4491055DAF6f3211d917f80212931819d2
LAZY_MINT_ADAPTER_ADDRESS=0x171318B8700CD5A8160fc282F975b89346D91C16
```

Migration
If the information about contract is changed, you should follow all the following commands.
```
yarn drop-schema
rm -rf src/migrations/*
yarn migration-create
yarn migration-up
```

Run the server without using a Dockerized PostgreSQL database if you want it.
```
yarn start-no-db
```

### Running frontend
```
cp .env.sample .env.dev
```

Copy these values from Betelgeuse project repository which can be retrieved from the following log generated whey deploying contracts or `.env` file of Betelgeuse.
```
# These constants are for .env of frontend
REACT_APP_SEAPORT_ADDRESS=0xF8E887c668F10D83c9aC391F22a5e2e1AfbCE18b
REACT_APP_ASSET_CONTRACT_SHARED_ADDRESS=0x19F8B9143588438e415223C6eD1E369e935130FC
REACT_APP_LAZY_MINT_ADAPTER_ADDRESS=0xc8587bde55D4186824BAC928A0d9f00b478c7103
REACT_APP_WETH_ADDRESS=0x6883994Ff042a26AE1f710e180B0d2A8225Fe348
REACT_APP_PAYABLE_PROXY_ADDRESS=0xa231949eFD93b3c156aAC734fB18Df1525b2B7d3
REACT_APP_MULTICALL_ADDRESS=0x33fcE949CAa1C9fCEBF486f6a7259c54B2f3EDE2
```
And set the value of `REACT_APP_MULTICALL_ADDRESS` to `REACT_APP_MULTICALL_ADDRESS_TESTNET`

Run the web server
```
yarn start:dev
```
or 
```
yarn start
```

## Tigger Swap

### tigger-swap-contracts
```
cp .env.sample .env
code ~/work/betelgeuse/contracts/.env
```
copy following env variables to current .env
```
WETH_ADDRESS=0x6883994Ff042a26AE1f710e180B0d2A8225Fe348
MULTICALL_ADDRESS=0x33fcE949CAa1C9fCEBF486f6a7259c54B2f3EDE2
```
Deploy
```angular2html
yarn deploy:localnet
```
Copy the results to the .env
```angular2html
WETH_ADDRESS=0x6883994Ff042a26AE1f710e180B0d2A8225Fe348
MULTICALL_ADDRESS=0x33fcE949CAa1C9fCEBF486f6a7259c54B2f3EDE2
FACTORY_ADDRESS=0xA6FBF5880FaAa1AbC7FD01d6915A3c1AaAB3Eb4A
ROUTER_ADDRESS=0x0fC9a2Ca2971feCd90daCF2aB6297492b0A20942
CALLHASH_ADDRESS=0xcdb5c7a94a3b876fbeb290dd258ac954a243df6f3dc0a6ab2568dc6e8e732ad3
FEE_TO=0x0000000000000000000000000000000000000000
BOA_ADDRESS=0x1A59e73559184658caD8cD0d888989F107c01AeC
GTOKEN_ADDRESS=0x479D03509d8d620EcFdf8db00B983d50eaf16884
ETOKEN_ADDRESS=0x3213AF3bDba7522d3a263072C9e1Fca8440C0f3B
```
Check the Pair
```angular2html
yarn get-pair:localnet
```

### tigger-bridge-contracts
Bridge contracts on tigger-bridge-contracts on Localnet
BOA_TOKEN_BRIDGE=0x87388bD5AdcD9A752B20c37dE2cDD8978d4c75Ff BOA_COIN_BRIDGE=0x3f7ADA8e897d72dE90097E1E1221bf8C988406Ea TOKEN_BRIDGE=0x39757B13270d50f2087D5fd15f83A6D6C31c7Fd2

BOA_TOKEN_BRIDGE=0x76386a0523fFd0261cBe70ACA8E61213e00bA4C5 BOA_COIN_BRIDGE=0x4557fF51D49ec670B59a5C883DC082b99eC485f8 TOKEN_BRIDGE=0x224d9B009450a3917287512Be181d2B3dCEc937A

Bridge contracts on tigger-bridge-contracts on PoohNet Devnet
BOA_TOKEN_BRIDGE=0x8f2961B7237cc28A1cA6f95371BE4Cd2c99f5Be5 BOA_COIN_BRIDGE=0x8C883156799698dF874Cc8Da00DdF971B744D801 TOKEN_BRIDGE=0x309E958ECb54C09094A0Fcd5F3478dB4bC33Babc

Approve User1's BOA to BOA_TOKEN_BRIDGE on on tigger-bridge-contracts Localnet
User1: 0xE024589D0BCd59267E430fB792B29Ce7716566dF(ae3b35fcbe8d65fa1e24802f95241ed22c6a68ea3958df0a40607a80bb292f97) yarn approve:localnet

Bridge contracts on tigger-bridge-contracts on PoohNet Devnet
BOA_TOKEN_BRIDGE=0x56A2438D895D7d8EDb3E22F41d11f1BFEbd11f26 BOA_COIN_BRIDGE=0x364D7a5D875C5ef272E9F3A73B94Db6f4f4bf7f6 TOKEN_BRIDGE=0xf1675e81da4Ccb7153EdF63955C19fcf0179ED87

Set the Admin to Manager role to BOA_COIN_BRIDGE on tigger-bridge-contracts Devnet
yarn setManager:devnet

Add liquidity to BOA_COIN_BRIDGE on tigger-bridge-contracts Devnet
yarn addLiquid:devnet

## Optimism

## Run Devnet/Marigold
### Marigold
```
./init marigold 1
./enode-cmd
```
### Devnet
The chain id is 7212302. So it uses enode-cmd-devnet.
```
./init devnet 1
./enode-cmd-devnet
```
As of 19th Nov. 2024, we use `http://3.37.37.195:8545` for the RPC URL.