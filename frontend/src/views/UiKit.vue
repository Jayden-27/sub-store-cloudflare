<template>
  <div class="ui-kit">
    <h1>UI Kit</h1>
    <p class="ui-kit__note">开发环境预览页：token 与基础组件。仅 <code>/dev/ui</code> 可访问。</p>

    <section class="ui-kit__section">
      <h2>语义色</h2>
      <div class="swatches">
        <div v-for="item in swatches" :key="item.name" class="swatch">
          <span class="swatch__chip" :style="{ background: item.value }" />
          <code>{{ item.name }}</code>
        </div>
      </div>
    </section>

    <section class="ui-kit__section">
      <h2>间距</h2>
      <div class="spacing">
        <div v-for="value in spacingValues" :key="value" class="spacing__row">
          <span class="spacing__bar" :style="{ width: `${value}px` }" />
          <code>{{ value }}px</code>
        </div>
      </div>
    </section>

    <section class="ui-kit__section">
      <h2>字号</h2>
      <div class="type">
        <p v-for="value in fontSizes" :key="value" :style="{ fontSize: `${value}px` }">
          {{ value }}px · Sub-Store Cloudflare
        </p>
      </div>
    </section>

    <section class="ui-kit__section">
      <h2>组件</h2>
      <Card title="示例卡片" description="Card 负责容器与标题层级，内容由页面决定。">
        <template #actions>
          <nut-button size="mini" type="primary">操作</nut-button>
        </template>
        <Field label="文本字段" hint="提示文字">
          <TextInput v-model="text" placeholder="请输入" />
        </Field>
        <Field label="数字字段">
          <NumberInput v-model="number" placeholder="0" />
        </Field>
        <Field label="选择字段">
          <SelectInput v-model="selected" :options="options" />
        </Field>
        <CheckRow v-model="checked" label="复选行" />
        <ListRow>
          <template #title>列表行标题</template>
          <template #meta>次要信息</template>
          <template #actions>
            <nut-button size="mini" plain>查看</nut-button>
          </template>
        </ListRow>
      </Card>
    </section>

    <section class="ui-kit__section">
      <h2>字段状态</h2>
      <Card title="错误与校验">
        <Field label="必填字段" error="这个值不能为空">
          <TextInput v-model="text" placeholder="空值示例" />
        </Field>
        <Field label="只读字段">
          <TextInput model-value="readonly value" readonly />
        </Field>
      </Card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Card, CheckRow, Field, ListRow, NumberInput, SelectInput, TextInput } from '@/ui';
import { fontSize, spacing } from '@/design/tokens';

const text = ref('');
const number = ref('0');
const selected = ref('a');
const checked = ref(true);
const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
];

const spacingValues = Object.values(spacing);
const fontSizes = Object.values(fontSize);

const SEMANTIC_COLORS = [
  'ui-surface-page',
  'ui-surface-card',
  'ui-surface-field',
  'ui-text-primary',
  'ui-text-secondary',
  'ui-text-tertiary',
  'ui-border-field',
  'ui-accent',
  'ui-danger',
];

const swatches = ref<Array<{ name: string; value: string }>>([]);

onMounted(() => {
  const styles = getComputedStyle(document.documentElement);
  swatches.value = SEMANTIC_COLORS.map((name) => ({
    name,
    value: styles.getPropertyValue(`--${name}`).trim(),
  }));
});
</script>

<style scoped lang="scss">
.ui-kit {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--ui-space-6) var(--ui-space-4) var(--ui-space-12);
  color: var(--ui-text-primary);
  font-size: var(--ui-font-base);
}

.ui-kit h1 {
  margin: 0 0 var(--ui-space-2);
  font-size: var(--ui-font-lg);
}

.ui-kit__note {
  margin: 0 0 var(--ui-space-6);
  color: var(--ui-text-tertiary);
  font-size: var(--ui-font-xs);
}

.ui-kit__section {
  margin-bottom: var(--ui-space-6);
}

.ui-kit__section h2 {
  margin: 0 0 var(--ui-space-3);
  font-size: var(--ui-font-md);
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--ui-space-3);
}

.swatch {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  font-size: var(--ui-font-xs);
  color: var(--ui-text-tertiary);
}

.swatch__chip {
  width: 28px;
  height: 28px;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border-field);
}

.spacing__row {
  display: flex;
  align-items: center;
  gap: var(--ui-space-3);
  margin-bottom: var(--ui-space-1);
}

.spacing__bar {
  height: 10px;
  border-radius: var(--ui-radius-sm);
  background: var(--ui-accent);
}

.type p {
  margin: 0 0 var(--ui-space-2);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--ui-font-xs);
}
</style>
