<template>
  <form
    class="grid gap-y-4 bg-white dark:bg-slate-900 w-lg max-w-full rounded-2xl py-4 px-6 shadow-lg mx-auto"
    @submit.prevent
  >
    <h2 class="mb-2 text-center font-bold text-2xl">
      Buy ${{ environment.lockedToken.id }} Tokens
    </h2>
    <template v-if="isConnected">
      <div class="truncate">
        <p class="font-bold mb-1">Address</p>
        <small-tag class="truncate cursor-pointer" @click="copyAddress">
          {{ address }}
        </small-tag>
      </div>

      <div class="flex justify-between flex-wrap gap-3">
        <div>
          <p class="font-bold mb-1">{{ environment.lockedToken.id }} Balance</p>
          <small-tag>
            {{ store.fixedNumber(lockedBalance) }}
            {{ environment.lockedToken.id }}
          </small-tag>
        </div>
        <div class="lg:text-right">
          <p class="font-bold mb-1">Balance</p>
          <small-tag>
            {{ store.fixedNumber(tokenFrom.balance) || 0 }} {{ tokenFrom.id }}
          </small-tag>
        </div>
      </div>
    </template>
    <div
      class="relative grid grid-cols-[minmax(min-content,100px),minmax(auto,1fr)] gap-x-4"
    >
      <token-selector
        :token-selected="tokenFrom"
        @selected-token="updateToken('setTokenFrom', $event)"
      />
      <token-input
        :key="`${balanceFrom}-${tokenFrom?.id}`"
        v-model="priceFrom"
        :balance="balanceFrom"
        :readonly="!isConnected"
      />
      <span></span>
      <div class="justify-end items-end w-full flex gap-1 mb-2">
        <base-button size="sm" @click="setBalance(0.5)">50%</base-button>
        <base-button size="sm" @click="setBalance(1)">Max</base-button>
      </div>
    </div>
    <div class="flex w-full items-center">
      <span class="flex-auto bg-gray-400 h-px"></span>
    </div>
    <div
      class="relative grid grid-cols-[minmax(max-content,100px),minmax(auto,1fr)] gap-4"
    >
      <div class="flex flex-wrap items-center gap-x-2">
        <img
          :src="environment.lockedToken.image"
          :alt="`${environment.lockedToken.id} logo`"
          width="40"
          height="40"
          class="rounded-full w-7 h-7 p-1"
          loading="lazy"
        />
        {{ environment.lockedToken.id }}
      </div>
      <token-input
        :key="`token-input-${tokenTo?.id}`"
        :model-value="priceTo"
        :readonly="true"
      />
      <p
        v-if="tokenFrom.price"
        class="col-span-2 text-xs flex items-center gap-2"
      >
        Price :
        <small-tag v-if="tokenFrom">{{
          `1 ${environment.lockedToken.id} = ${tokenFrom?.price} ${tokenFrom?.id}`
        }}</small-tag>
        <small-tag v-else>-</small-tag>
      </p>
    </div>
    <button
      type="submit"
      class="button-submit animate-pulse text-green-600 dark:text-green-400 bg-green-400/10 hover:bg-green-400/20 w-full p-4 font-bold rounded-lg"
      :disabled="loading"
      @click="submit"
    >
      {{
        loading
          ? 'Proccessing...'
          : isConnected
          ? 'Buy Token'
          : 'Connect Wallet'
      }}
    </button>

    <button
      v-if="isConnected"
      class="p-2 text-red-400 hover:underline"
      @click="store.disconnectWallet()"
    >
      Disconnect wallet
    </button>
  </form>
  <div class="grid gap-y-4 w-lg max-w-full py-10 px-6 mx-auto">
    <button
      class="flex items-center justify-center text-[#FFA800] hover:underline font-bold rounded-lg"
      @click="store.addTokenAsset"
    >
      <img
        src="/images/metamask.svg"
        alt="metamask"
        class="h-6 text-white mx-2"
      />
      Import ${{ environment.lockedToken.id }} Token to Metamask
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ComputedRef, watch } from 'vue';
import BigNumber from 'bignumber.js';
import { Token, useTokens } from '../../store/tokens';
import SmallTag from '../atoms/SmallTag.vue';
import TokenInput from '../atoms/TokenInput.vue';
import TokenSelector from '../molecules/TokenSelector.vue';
import { storeToRefs } from 'pinia';
import { useUser } from '../../store/user';
import { environment } from '../../environment';
import { useStore } from '../../store';
import BaseButton from '../BaseButton.vue';
import { useClipboard } from '@vueuse/core';
import { useToast } from 'vue-toastification';

BigNumber.config({ EXPONENTIAL_AT: [-20, 20] });

const toast = useToast();
const store = useStore();
const { isConnected, loading } = storeToRefs(store);

const { setTokenFrom, setTokenTo } = useTokens();

const { priceTo, tokenTo, priceFrom, tokenFrom } = storeToRefs(useTokens());

const { lockedBalance, address } = storeToRefs(useUser());

const copyAddress = () => {
  const { copy, copied } = useClipboard({ source: address });
  copy();
  if (copied) toast.success('Address copied!');
};

const balanceFrom: ComputedRef<string> = computed(
  () => tokenFrom.value?.balance
);

watch(priceFrom, (val) => {
  priceTo.value = store.calculateParityFromTo(
    tokenFrom.value.price,
    val as string
  );
});

const setBalance = (val: number) => {
  if (!tokenFrom.value.balance) return '0';
  priceFrom.value = (tokenFrom.value.balance * val).toString();
};

const submit = () => {
  if (!isConnected.value) {
    store.connectWallet();
  } else if (store.checkLimitation(priceTo.value, tokenFrom.value)) {
    store.buyToken(priceFrom.value, tokenFrom.value as Token);
  }
};

const updateToken = (action: string, token: Token) => {
  if (action === 'setTokenFrom') {
    setTokenFrom(token);
  } else if (action === 'setTokenTo') {
    setTokenTo(token);
  }
};
</script>

<style scoped>
.button-submit:disabled {
  @apply bg-gray-700 text-white cursor-not-allowed;
}
</style>
