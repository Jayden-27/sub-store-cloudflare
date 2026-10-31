<template>
  <select
    class="ui-select"
    :value="modelValue ?? ''"
    :disabled="disabled"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled hidden>{{ placeholder }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
export type SelectOption = { value: string; label: string };

defineProps<{
  modelValue?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
};
</script>

<style scoped lang="scss">
.ui-select {
  box-sizing: border-box;
  min-width: 0;
  min-height: var(--ui-field-height);
  padding: 0 var(--ui-space-3);
  border: 1px solid var(--ui-border-field);
  border-radius: var(--ui-radius-md);
  background: var(--ui-surface-field);
  color: var(--ui-text-primary);
  font-size: var(--ui-font-base);
  transition: border-color var(--ui-duration-fast) ease, box-shadow var(--ui-duration-fast) ease;

  &:focus {
    outline: none;
    border-color: var(--ui-accent);
    box-shadow: 0 0 0 2px var(--ui-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ui-accent) 20%, transparent);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
