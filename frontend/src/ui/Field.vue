<template>
  <div class="ui-field" :class="[`is-${layout}`, { 'is-invalid': Boolean(error) }]">
    <div class="ui-field__row">
      <label v-if="label" class="ui-field__label" :for="forId">
        {{ label }}
        <small v-if="hint" class="ui-field__hint">{{ hint }}</small>
      </label>
      <div class="ui-field__control">
        <slot />
      </div>
    </div>
    <p v-if="error" class="ui-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    error?: string;
    forId?: string;
    layout?: 'inline' | 'stacked';
  }>(),
  { layout: 'inline' },
);
</script>

<style scoped lang="scss">
.ui-field {
  & + .ui-field {
    border-top: 1px solid var(--ui-border-subtle);
  }
}

.ui-field__row {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-height: 56px;
  font-size: var(--ui-font-base);
}

.ui-field__label {
  flex: 0 1 auto;
  color: var(--ui-text-secondary);
  font-size: var(--ui-font-sm);
  line-height: var(--ui-leading-normal);
}

.ui-field__hint {
  margin-left: var(--ui-space-2);
  color: var(--ui-text-tertiary);
  font-size: var(--ui-font-xs);
}

.ui-field__control {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.ui-field__error {
  margin: calc(var(--ui-space-1) * -1) 0 var(--ui-space-2);
  color: var(--ui-danger);
  font-size: var(--ui-font-xs);
  line-height: var(--ui-leading-normal);
  text-align: right;
}

@mixin stacked-layout {
  padding: var(--ui-space-2) 0;

  :deep(.ui-field__control > *) {
    flex: 1 1 auto;
    width: 100%;
  }

  .ui-field__row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ui-space-2);
  }

  .ui-field__control {
    justify-content: stretch;
  }

  .ui-field__error {
    text-align: left;
  }
}

.ui-field.is-stacked {
  @include stacked-layout;
}

@media (max-width: 520px) {
  .ui-field.is-inline {
    @include stacked-layout;
  }
}
</style>
