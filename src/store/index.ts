/* eslint-disable @typescript-eslint/no-explicit-any */
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useUser } from './user';

import presaleAbi from '../contracts/presaleAbi.json';
import tokenAbi from '../contracts/tokenAbi.json';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3 from 'web3';
import { useToast } from 'vue-toastification';
import { environment } from '../environment';
import { Token, useTokens } from './tokens';

export const useStore = defineStore('store', () => {
  const web3 = ref<any>(undefined);

  let provider: any = null;

  const presaleContract = ref<any>(undefined);

  const user = useUser();
  const { address, lockedBalance } = storeToRefs(user);
  const { tokens, priceFrom, priceTo } = storeToRefs(useTokens());

  const toast = useToast();

  const isConnected = ref(false);

  const loading = ref(false);

  const presaleEndTime = ref(0);

  const totalTokensSold = ref(0);

  const fixedNumber = (num: number) => +parseFloat((+num).toFixed(6));

  const unitMap: any = {
    0: 'wei',
    3: 'kwei',
    6: 'mwei',
    9: 'gwei',
    12: 'szabo',
    15: 'finney',
    18: 'ether',
  };

  const formatUnit = (number: string, decimals: any = 18) =>
    web3.value.utils.fromWei(number, unitMap[decimals]);
  const parseUnit = (number: string | number, decimals: any = 18) =>
    web3.value.utils.toWei(number, unitMap[decimals]);

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: { [environment.networkId]: environment.rpcUrl },
        chainId: environment.networkId,
        qrcodeModalOptions: {
          mobileLinks: [
            'trust',
            'metamask',
            'rainbow',
            'argent',
            'imtoken',
            'pillar',
          ],
        },
      },
    },
  };

  const web3Modal = new Web3Modal({
    network: 'mainnet', // optional
    cacheProvider: true, // optional
    providerOptions, // required
    theme: {
      background: 'rgb(39, 49, 56)',
      main: 'rgb(199, 199, 199)',
      secondary: 'rgb(136, 136, 136)',
      border: 'rgba(195, 195, 195, 0.14)',
      hover: 'rgb(16, 26, 32)',
    },
  });

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: web3.value.utils.toHex(environment.networkId) }],
      });
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: environment.networkName,
              chainId: web3.value.utils.toHex(environment.networkId),
              nativeCurrency: {
                name: environment.networkMainToken,
                decimals: 18,
                symbol: environment.networkMainToken,
              },
              rpcUrls: [environment.rpcUrl],
            },
          ],
        });
      } else {
        console.log(err);
        toast.error('Please switch to BSC Network');
        return false;
      }
    }
    return true;
  };

  const checkNetwork = async () => {
    const networkId = await web3.value.eth.net.getId();

    if (environment.networkId !== networkId) {
      const result = await switchNetwork();
      if (!result) return;
    }

    presaleContract.value = new web3.value.eth.Contract(
      presaleAbi as any,
      environment.presaleAddress
    );

    presaleEndTime.value = await presaleContract.value.methods
      .preSaleEndTime()
      .call();

    return true;
  };

  async function getAccount() {
    const accounts = await web3.value.eth.getAccounts();

    if (accounts && accounts.length > 0) address.value = accounts[0];

    if (!(await checkNetwork())) return;

    const netBalanceResourse = await web3.value.eth.getBalance(address.value);

    const netBalance = formatUnit(netBalanceResourse);

    tokens.value.forEach(async (token) => {
      if (token.id === environment.networkMainToken) {
        token.balance = netBalance;
        const rateOfNativeCurrencyResponse = await presaleContract.value.methods
          .rate()
          .call();
        token.price = formatUnit(rateOfNativeCurrencyResponse);
        // changeSelectFromToken(token.token);
        return;
      }

      const contract = new web3.value.eth.Contract(tokenAbi, token.address);
      const tokenBalance = await contract.methods
        .balanceOf(address.value)
        .call();
      token.balance = formatUnit(tokenBalance, token.decimals);

      const rateOfToken = await presaleContract.value.methods
        .tokenPrices(token.address)
        .call();

      token.price = formatUnit(rateOfToken, token.decimals);
    });

    tokens.value = [...tokens.value];

    fetchBuyersAmount();

    fetchTotalTokensSold();

    loading.value = false;
  }

  const connectWallet = async () => {
    loading.value = true;

    provider = await web3Modal.connect();

    if (provider) {
      try {
        web3.value = new Web3(provider);

        provider.on('accountsChanged', getAccount);

        provider.on('chainChanged', getAccount);

        const accounts = await web3.value.eth.getAccounts();

        address.value = accounts[0];

        if (address.value) isConnected.value = true;

        if (!(await checkNetwork())) return;

        await getAccount();
      } catch (e) {
        toast.error('Connect grant failed! Please login aagain');
      }
    }
  };

  const disconnectWallet = async () => {
    if (provider.close) {
      await provider.close();
      provider = null;
    }

    await web3Modal.clearCachedProvider();

    address.value = '';
    presaleEndTime.value = 0;
    priceFrom.value = '';
    priceTo.value = '';

    tokens.value.forEach((token) => {
      token.price = 0;
      token.balance = '0';
    });

    isConnected.value = false;
  };

  const fetchBuyersAmount = async () => {
    const tokenContract = new web3.value.eth.Contract(
      tokenAbi,
      environment.lockedToken.address
    );
    const balance = await tokenContract.methods.balanceOf(address.value).call();
    lockedBalance.value = formatUnit(
      web3.value.utils.toBN(balance),
      environment.lockedToken.decimals
    );
  };

  const buyToken = async (value: string | number, token: Token) => {
    if (!+value) return;
    loading.value = true;
    try {
      const amount = parseUnit(value, token.decimals);

      if (token.id === environment.networkMainToken) {
        await presaleContract.value.methods
          .buyToken(
            environment.ZERO_ADDRESS,
            '0'.repeat(environment.TOKEN_DECIMAL)
          )
          .send({
            from: address.value,
            value: amount,
          });
      } else {
        const tokenContract = new web3.value.eth.Contract(
          tokenAbi,
          token.address
        );

        const allowance = await tokenContract.methods
          .allowance(address.value, environment.presaleAddress)
          .call();

        if (!Number(allowance)) {
          await tokenContract.methods
            .approve(
              environment.presaleAddress,
              parseUnit('9999999999999999999999999999')
            )
            .send({ from: address.value, gas: 300_000 });
          toast.success('Spend approved');
        }

        await presaleContract.value.methods
          .buyToken(token.address, amount)
          .send({ from: address.value, gas: 300_000 });
      }

      // if (environment.apiUrl) {
      //   axios.post(`${environment.apiUrl}/purchase-successful`, payload);
      // }

      toast.success(
        `You have successfully purchased $${environment.lockedToken.id} Tokens. Thank you!`
      );

      fetchBuyersAmount();
      fetchTotalTokensSold();

      tokens.value.forEach(async (token) => {
        if (token.id === environment.networkMainToken) {
          const netBalanceResponse = await web3.value.eth.getBalance(
            address.value
          );
          const netBalance = formatUnit(netBalanceResponse);

          token.balance = netBalance;
          return;
        }
        const contract = new web3.value.eth.Contract(tokenAbi, token.address);
        const tokenBalance = await contract.methods
          .balanceOf(address.value)
          .call();

        const balance = formatUnit(tokenBalance, token.decimals);
        token.balance = balance;
      });
    } catch (error: any) {
      toast.error(error?.message || 'Signing failed, please try again!');
    }
    loading.value = false;
  };

  const unlockToken = async (amount: string) => {
    if (!+amount) return;
    loading.value = true;

    try {
      const netToken = tokens.value.find(
        (t) => t.id === environment.networkMainToken
      );
      const amountInNetToken = calculateParityToFrom(
        netToken?.price as string,
        amount
      );

      await presaleContract.value.methods.withdrawToken().send({
        from: address.value,
        value: parseUnit(
          amountInNetToken.toString(),
          environment.lockedToken.decimals
        ),
      });

      toast.success('Unlock was successful');
      fetchBuyersAmount();
    } catch (error) {
      toast.error('Signing failed, please try again!');
    }

    loading.value = false;
  };

  const calculateParityToFrom = (parityRate: string, value: string) => {
    if (!+parityRate || !+value) return 0;
    return Number.parseFloat(value) * Number.parseFloat(parityRate);
  };

  const calculateParityFromTo = (parityRate: string, value: string) => {
    if (!+parityRate || !+value) return 0;
    return Number.parseFloat(value) / Number.parseFloat(parityRate);
  };

  const addTokenAsset = async () => {
    const imgUrl = environment.lockedToken.image;
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: environment.lockedToken.address,
            symbol: environment.lockedToken.id,
            image: imgUrl.includes('http')
              ? imgUrl
              : `${window.origin}/${imgUrl}`,
            decimals: 18,
          },
        },
      });
      toast.success('Token imported to metamask successfully');
    } catch (e) {
      toast.error('Token import failed');
    }
  };

  const fetchTotalTokensSold = async () => {
    try {
      const totalTokensSoldAmount = await presaleContract.value.methods
        .totalTokensSold()
        .call();

      totalTokensSold.value = formatUnit(
        totalTokensSoldAmount,
        environment.lockedToken.decimals
      );
    } catch (error) {
      toast.error('Something goes wrong, please try again!');
    }
  };

  const checkLimitation = (priceTo: string | number = 0, tokenFrom: Token) => {
    const rate = tokenFrom?.price;

    if (!rate) return false;

    const totalBalance = (+lockedBalance.value + +priceTo) * +rate;
    if (totalBalance < environment.minTokenAmount) {
      toast.error(
        `You can not buy less than ${environment.minTokenAmount} ${tokenFrom.id}`
      );
      return false;
    } else if (totalBalance > environment.maxTokenAmount) {
      toast.error(
        `You can not buy more than ${environment.maxTokenAmount} ${tokenFrom.id}`
      );
      return false;
    }

    return true;
  };

  return {
    web3,
    provider,
    isConnected,
    loading,
    presaleEndTime,
    totalTokensSold,
    connectWallet,
    disconnectWallet,
    fetchBuyersAmount,
    buyToken,
    unlockToken,
    calculateParityToFrom,
    calculateParityFromTo,
    addTokenAsset,
    checkLimitation,
    fixedNumber,
  } as const;
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot));
}
