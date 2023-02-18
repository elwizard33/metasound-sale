<template>
  <teleport to="head">
    <title>{{ title }}</title>
    <!-- ZiLab -->
    <meta name="description" :content="description" />
    <meta name="og:title" :content="title" />
    <meta name="og:description" :content="description" />
    <meta name="og:image" :content="imageUrl" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" :content="title" />
    <meta name="twitter:description" :content="description" />
    <meta name="twitter:image" :content="imageUrl" />
  </teleport>
  <main class="flex flex-col justify-between min-h-screen">
    <AppHeader />
    <router-view></router-view>
    <div className="pb-5 w-full text-center">
      Copyright © {{ new Date().getFullYear() }} All Rights Reserved.
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import AppHeader from './components/layout/AppHeader.vue';
import { environment } from './environment';
import { useTheme } from './store/theme';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
  },
  data() {
    return {
      title: environment.meta.title,
      description: environment.meta.description,
      imageUrl: '/images/logo.png',
    };
  },
  mounted() {
    const { setTheme, theme } = useTheme();
    setTheme(theme);
  },
});
</script>

<style>
body {
  @apply antialiased bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-[#f3f4f6];
  background-image: url('/images/back.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
