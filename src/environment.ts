export const environment = {
  title: 'Metasound Launch',
  logo: '/images/logo.png',
  meta: {
    title: 'Buy Metas',
    description: 'Metasound',
  },
  telegramUrl: 'https://t.me/gabocarranza',
  presaleAddress: '0xF8C0e716D812821394713BADF79A2Ed809B3694b', // Pre-sale smart contract address
  networkName: 'Polygon',
  networkMainToken: 'Polygon',
  networkId: 80001,
  rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  TOKEN_DECIMAL: 18,

  // this min-max range is used to calculate the amount of tokens to buy in $dollars
  minTokenAmount: 0,
  maxTokenAmount: 3000,

  lockedToken: {
    id: 'METAS',
    image: '/images/logo.png',
    address: '0x2cF5F626f8e26b665e00E808d6A9fBfbe565bf65', // Your token smart contract address
    decimals: 8,
  },

  tokens: [
    // {
    //   id: 'ETH',
    //   name: 'Ethereum',
    //   address: undefined,
    //   image: '/images/tokens/eth.svg',
    //   decimals: 18,
    // },
    {
      id: 'USDC',
      name: 'USD Coin',
      address: '0xE097d6B3100777DC31B34dC2c58fB524C2e76921',
      image: '/images/tokens/centre-usdc_28.webp',
      decimals: 6,
    },
    // {
    //   id: 'BUSD',
    //   name: 'Binance-Peg BSC-USD (BSC-USD)',
    //   address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    //   image: '/images/tokens/busd_32.webp',
    //   decimals: 18,
    // },
    // {
    //   id: 'USDC',
    //   name: 'Binance-Peg USD Coin',
    //   address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    //   image: '/images/tokens/centre-usdc_28.webp',
    //   decimals: 18,
    // },
  ],
};
