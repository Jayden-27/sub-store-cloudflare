<template>
  <label class="ui-check-row">
    <input
      class="ui-check-row__box"
      type="checkbox"
      :checked="Boolean(modelValue)"
      @change="onChange"
    />
    <span class="ui-check-row__label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
  label?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
};
</script>

<style scoped lang="scss">
.ui-check-row {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  min-height: 38px;
  color: var(--ui-text-secondary);
  font-size: var(--ui-font-sm);
  cursor: pointer;
}

.ui-check-row__box {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--ui-accent);
  cursor: pointer;
}
</style>
