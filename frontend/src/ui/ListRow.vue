<template>
  <div class="ui-list-row">
    <div class="ui-list-row__main">
      <strong class="ui-list-row__title"><slot name="title" /></strong>
      <small class="ui-list-row__meta"><slot name="meta" /></small>
    </div>
    <div v-if="$slots.actions" class="ui-list-row__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.ui-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-3);
  min-height: 60px;
}

.ui-list-row + .ui-list-row {
  border-top: 1px solid var(--ui-border-subtle);
}

.ui-list-row__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-1);
}

.ui-list-row__title {
  color: var(--ui-text-primary);
  font-size: var(--ui-font-sm);
  overflow-wrap: anywhere;
}

.ui-list-row__meta {
  color: var(--ui-text-tertiary);
  font-size: var(--ui-font-xs);
}

.ui-list-row__actions {
  display: flex;
  gap: var(--ui-space-2);
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .ui-list-row {
    align-items: flex-start;
    flex-direction: column;
    padding: var(--ui-space-2) 0;
  }
}
</style>
