<template>
  <section class="ui-card">
    <header v-if="title || $slots.actions" class="ui-card__header">
      <h2 v-if="title" class="ui-card__title">{{ title }}</h2>
      <div v-if="$slots.actions" class="ui-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <p v-if="description" class="ui-card__desc">{{ description }}</p>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<style scoped lang="scss">
.ui-card {
  padding: var(--ui-space-5);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface-card);
  color: var(--ui-text-secondary);
}

.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-3);
}

.ui-card__title {
  margin: 0;
  color: var(--ui-text-primary);
  font-size: var(--ui-font-md);
  line-height: var(--ui-leading-tight);
}

.ui-card__desc {
  margin: var(--ui-space-2) 0 0;
  color: var(--ui-text-tertiary);
  font-size: var(--ui-font-xs);
  line-height: var(--ui-leading-normal);
}
</style>
