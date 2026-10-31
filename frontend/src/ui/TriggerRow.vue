<template>
  <button
    type="button"
    class="ui-trigger"
    :class="{ 'is-disabled': disabled }"
    :disabled="disabled"
    @click="emit('click')"
  >
    <span
      v-if="$slots.prefix"
      class="ui-trigger__icon"
      @click.stop="emit('prefix-click')"
    >
      <slot name="prefix" />
    </span>
    <span class="ui-trigger__value">{{ value }}</span>
    <nut-icon
      v-if="chevron !== 'none'"
      class="ui-trigger__chevron"
      :name="chevron === 'down' ? 'rect-down' : 'rect-right'"
      size="12px"
    />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    value?: string;
    chevron?: 'right' | 'down' | 'none';
    disabled?: boolean;
  }>(),
  { chevron: 'right' },
);

const emit = defineEmits<{ click: []; 'prefix-click': [] }>();
</script>

<style scoped lang="scss">
.ui-trigger {
  display: flex;
  align-items: center;
  gap: var(--ui-space-1);
  width: var(--ui-field-width);
  min-height: var(--ui-field-height);
  margin-left: auto;
  padding: 0 var(--ui-space-3);
  border: 1px solid var(--ui-border-field);
  border-radius: var(--ui-radius-md);
  background: var(--ui-surface-field);
  color: var(--ui-text-primary);
  font-size: var(--ui-font-base);
  text-align: left;
  cursor: pointer;

  &:disabled,
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.ui-trigger__icon {
  flex: 0 0 auto;
  display: inline-flex;
  color: var(--ui-text-tertiary);
}

.ui-trigger__value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.ui-trigger__chevron {
  flex: 0 0 auto;
  color: var(--ui-text-tertiary);
}

@media (max-width: 520px) {
  .ui-trigger {
    width: auto;
    flex: 1 1 auto;
    margin-left: 0;
  }
}
</style>
