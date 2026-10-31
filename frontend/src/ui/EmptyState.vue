<template>
  <div class="ui-empty">
    <font-awesome-icon
      v-if="icon"
      class="ui-empty__icon"
      :icon="icon"
    />
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description" class="ui-empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="ui-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: string;
  }>(),
  { icon: 'fa-solid fa-file-lines' },
);
</script>

<style scoped lang="scss">
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  padding: var(--ui-space-8) var(--ui-space-4);
  text-align: center;
}

.ui-empty__icon {
  margin-bottom: var(--ui-space-1);
  color: var(--ui-text-tertiary);
  font-size: 28px;
  opacity: 0.7;
}

.ui-empty__title {
  margin: 0;
  color: var(--ui-text-secondary);
  font-size: var(--ui-font-base);
}

.ui-empty__desc {
  margin: 0;
  color: var(--ui-text-tertiary);
  font-size: var(--ui-font-sm);
  line-height: var(--ui-leading-normal);
}

.ui-empty__action {
  margin-top: var(--ui-space-2);
}
</style>
