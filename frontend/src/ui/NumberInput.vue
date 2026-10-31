<template>
  <TextInput
    :id="id"
    :model-value="modelValue"
    :placeholder="placeholder"
    :readonly="readonly"
    type="number"
    inputmode="decimal"
    @update:model-value="(value: string) => emit('update:modelValue', value)"
  />
</template>

<script setup lang="ts">
import TextInput from './TextInput.vue';

withDefaults(
  defineProps<{
    modelValue?: string | number;
    placeholder?: string;
    readonly?: boolean;
    id?: string;
  }>(),
  {},
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>
