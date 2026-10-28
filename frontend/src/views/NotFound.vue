<template>
  <div class="wrapper">
    
    <h3 v-if="isBackend">
      <p>{{ $t('notFoundPage.backendDesc') }}</p>
    </h3>
    <h3 v-else>{{ $t('notFoundPage.title') }}</h3>
    <router-link to="/">{{ $t('notFoundPage.desc') }}</router-link>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const isBackend = /\/(api|download)\/.+/.test(route.fullPath)
</script>

<style lang="scss" scoped>
  .wrapper {
    width: 100%;
    flex: 1;
    min-height: 100%;
    padding: calc(56px + 16px) 24px 24px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: var(--primary-text-color);

    h3 {
      padding: 0 24px 24px 24px;
    }
  }
</style>
