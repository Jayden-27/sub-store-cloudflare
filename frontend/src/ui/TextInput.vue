<template>
  <div
    class="ui-input"
    :class="[`is-${size}`, `is-${variant}`]"
    @focusout="emit('blur', $event)"
  >
    <button
      v-if="$slots.prefix"
      class="ui-input__icon"
      type="button"
      @click.stop="emit('prefix-click')"
    >
      <slot name="prefix" />
    </button>
    <nut-input
      :id="id"
      class="ui-input__control"
      :model-value="displayValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :type="type"
      :inputmode="inputmode"
      :border="false"
      :clearable="clearable"
      :autofocus="autofocus"
      :max-length="maxlength"
      :input-align="align"
      @update:model-value="onInput"
      @clear="emit('clear')"
    />
    <button
      v-if="$slots.suffix"
      class="ui-input__icon"
      type="button"
      @click.stop="emit('suffix-click')"
    >
      <slot name="suffix" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    placeholder?: string;
    readonly?: boolean;
    type?: 'text' | 'number' | 'url';
    inputmode?: 'text' | 'numeric' | 'decimal' | 'url';
    mono?: boolean;
    id?: string;
    size?: 'md' | 'sm';
    variant?: 'field' | 'plain';
    trim?: boolean;
    clearable?: boolean;
    autofocus?: boolean;
    maxlength?: number;
    align?: 'left' | 'right';
  }>(),
  { type: 'text', size: 'md', variant: 'field', align: 'right' },
);

const emit = defineEmits<{
  'update:modelValue': [string];
  'prefix-click': [];
  'suffix-click': [];
  clear: [];
  blur: [FocusEvent];
}>();

const displayValue = computed(() => String(props.modelValue ?? ''));

const onInput = (value: string | number) => {
  const text = String(value ?? '');
  emit('update:modelValue', props.trim ? text.trim() : text);
};
</script>

<style scoped lang="scss">
.ui-input {
  display: flex;
  align-items: center;
  gap: var(--ui-space-1);
  flex: 0 1 var(--ui-field-width);
  width: var(--ui-field-width);
  margin-left: auto;
  min-width: 0;
  min-height: var(--ui-field-height);
  padding: 0 var(--ui-space-3);
  background: var(--ui-surface-field);
  border: 1px solid var(--ui-border-field);
  border-radius: var(--ui-radius-md);
  transition: border-color var(--ui-duration-fast) ease, box-shadow var(--ui-duration-fast) ease;

  &:focus-within {
    border-color: var(--ui-accent);
    box-shadow: 0 0 0 2px var(--ui-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ui-accent) 20%, transparent);
  }

  &.is-sm {
    min-height: 32px;
    padding: 0 var(--ui-space-2);
    border-radius: var(--ui-radius-sm);
    font-size: var(--ui-font-base);
  }

  &.is-plain {
    background: transparent;
    border-color: transparent;
    padding: 0;
    width: auto;
    margin-left: 0;
    flex: 1 1 auto;

    &:focus-within {
      border-color: transparent;
      box-shadow: none;
    }
  }

  :deep(.ui-input__control),
  :deep(.nut-input),
  :deep(.nut-input-value),
  :deep(.nut-input-inner),
  :deep(.nut-input-box),
  :deep(input) {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    padding: 0;
    background: transparent;
    background-color: transparent;
    border: 0;
    box-shadow: none;
    border-radius: 0;
  }

  &.is-mono :deep(input) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: var(--ui-font-sm);
  }
}

.ui-input__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ui-text-tertiary);
  cursor: pointer;
}

@media (max-width: 520px) {
  .ui-input:not(.is-sm) {
    flex: 1 1 auto;
    width: auto;
    margin-left: 0;
  }
}
</style>
