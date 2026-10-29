<template>
  <nut-popup
    :visible="visible"
    :position="isWideScreen ? 'center' : 'bottom'"
    :style="popupStyle"
    :z-index="12000"
    round
    closeable
    @update:visible="onVisibleChange"
  >
    <div
      class="smart-import-panel"
      role="dialog"
      aria-modal="true"
      :aria-label="t('subPage.smartImport.title')"
      tabindex="-1"
      data-dialog-focus
    >
      <h2>{{ t('subPage.smartImport.title') }}</h2>
      <p class="panel-desc">{{ t('subPage.smartImport.desc') }}</p>

      <label class="source-field">
        <span class="field-label">{{ t('subPage.smartImport.inputLabel') }}</span>
        <textarea
          v-model="content"
          class="source-textarea"
          :placeholder="t('subPage.smartImport.placeholder')"
          spellcheck="false"
          @input="invalidatePreview"
        />
      </label>

      <div class="source-actions">
        <input ref="fileInput" class="file-input" type="file" accept=".json,.yaml,.yml,.txt,text/plain,application/json" @change="importFile" />
        <nut-button plain type="primary" size="small" @click="selectFile">
          {{ t('subPage.smartImport.selectFile') }}
        </nut-button>
        <span class="file-name">{{ fileName || t('subPage.smartImport.fileHint') }}</span>
      </div>

      <label class="group-toggle">
        <nut-switch v-model="groupByRegion" @change="invalidatePreview" />
        <span>{{ t('subPage.smartImport.groupByRegion') }}</span>
      </label>
      <p class="group-hint">{{ t('subPage.smartImport.groupHint') }}</p>

      <p v-if="errorMessage" class="import-error" role="alert">{{ errorMessage }}</p>

      <div v-if="groupRows.length > 0" class="import-preview">
        <p class="preview-summary">
          {{ t('subPage.smartImport.summary', { total: preview.total, addable: preview.addable, duplicates: preview.duplicates }) }}
        </p>
        <p class="target-note">{{ t('subPage.smartImport.targetNote') }}</p>
        <div class="group-list">
          <div
            v-for="group in groupRows"
            :key="group.id"
            class="group-row"
            :class="{ disabled: !group.enabled, 'needs-review': group.needsReview }"
          >
            <label class="group-enable">
              <input v-model="group.enabled" type="checkbox" />
              <span>{{ group.label }}</span>
            </label>
            <p v-if="group.needsReview" class="review-hint">{{ t('subPage.smartImport.needsReview') }}</p>
            <div class="group-content">
              <div class="group-counts">
                <span>{{ t('subPage.smartImport.groupTotal', { count: group.total }) }}</span>
                <span>{{ t('subPage.smartImport.groupAddable', { count: group.addable }) }}</span>
                <span v-if="group.duplicates">{{ t('subPage.smartImport.groupDuplicates', { count: group.duplicates }) }}</span>
              </div>
              <label class="target-field">
                <span>{{ t('subPage.smartImport.targetLabel') }}</span>
                <select v-model="group.targetSourceId" :disabled="!group.enabled">
                  <option v-if="group.needsReview" value="" disabled>{{ t('subPage.smartImport.selectTarget') }}</option>
                  <option :value="group.newSourceId">{{ t('subPage.smartImport.createTarget', { name: group.newSourceName }) }}</option>
                  <option v-for="source in localSources" :key="source.value" :value="source.value">
                    {{ t('subPage.smartImport.existingTarget', { name: source.label }) }}
                  </option>
                </select>
              </label>
              <p v-if="group.samples.length" class="group-samples">
                {{ t('subPage.smartImport.samples', { names: group.samples.join('、') }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="preview-empty">{{ t('subPage.smartImport.noPreview') }}</p>

      <div class="panel-footer">
        <nut-button plain type="primary" :loading="parsing" @click="parsePreview">
          {{ groupRows.length ? t('subPage.smartImport.reparse') : t('subPage.smartImport.parse') }}
        </nut-button>
        <nut-button type="primary" :loading="applying" :disabled="!canApply" @click="applyImport">
          {{ t('subPage.smartImport.apply') }}
        </nut-button>
      </div>
    </div>
  </nut-popup>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCloudflareApi } from '@/api/app';
import { useAppNotifyStore } from '@/store/appNotify';
import { useWideScreenNarrowMode } from '@/hooks/useWideScreenNarrowMode';

type ImportGroupRow = {
  id: string;
  label: string;
  total: number;
  addable: number;
  duplicates: number;
  samples: string[];
  needsReview: boolean;
  newSourceId: string;
  newSourceName: string;
  targetSourceId: string;
  enabled: boolean;
};

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  imported: [];
}>();

const api = useCloudflareApi();
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const { isWideScreen } = useWideScreenNarrowMode();
const content = ref('');
const fileName = ref('');
const fileInput = ref<HTMLInputElement>();
const parsing = ref(false);
const applying = ref(false);
const errorMessage = ref('');
const groupByRegion = ref(true);
const localSources = ref<Array<{ value: string; label: string }>>([]);
const preview = reactive({
  total: 0,
  addable: 0,
  duplicates: 0,
});
const groupRows = reactive<ImportGroupRow[]>([]);

const popupStyle = computed(() => ({
  width: isWideScreen.value ? '760px' : undefined,
  maxWidth: '94vw',
  height: isWideScreen.value ? '84vh' : '92vh',
}));
const canApply = computed(() => {
  const enabled = groupRows.filter((group) => group.enabled);
  return enabled.length > 0
    && enabled.every((group) => Boolean(group.targetSourceId))
    && !parsing.value
    && !applying.value;
});

const onVisibleChange = (visible: boolean) => {
  emit('update:visible', visible);
};

const selectFile = () => {
  fileInput.value?.click();
};

const importFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;
  try {
    content.value = await file.text();
    fileName.value = file.name;
    invalidatePreview();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
};

function invalidatePreview() {
  groupRows.splice(0);
  preview.total = 0;
  preview.addable = 0;
  preview.duplicates = 0;
  errorMessage.value = '';
}

const loadSources = async () => {
  const response = await api.getSources();
  const sources = (response?.data as any)?.data;
  localSources.value = Array.isArray(sources)
    ? sources
      .filter((source: any) => source.source === 'local')
      .map((source: any) => ({
        value: String(source.name || ''),
        label: String(source.displayName || source.name || ''),
      }))
      .filter((source: { value: string }) => source.value)
    : [];
};

const parsePreview = async () => {
  if (!content.value.trim()) {
    errorMessage.value = t('subPage.smartImport.needContent');
    return;
  }
  parsing.value = true;
  errorMessage.value = '';
  try {
    const response = await api.previewNodeImport({ content: content.value, groupByRegion: groupByRegion.value });
    const data = (response?.data as any)?.data;
    if (!data || !Array.isArray(data.groups)) throw new Error(t('subPage.smartImport.failed', { e: 'Invalid preview' }));
    preview.total = Number(data.total || 0);
    preview.addable = Number(data.addable || 0);
    preview.duplicates = Number(data.duplicates || 0);
    const rows: ImportGroupRow[] = data.groups.map((group: any) => ({
      id: String(group.id),
      label: String(group.label),
      total: Number(group.total || 0),
      addable: Number(group.addable || 0),
      duplicates: Number(group.duplicates || 0),
      samples: Array.isArray(group.samples) ? group.samples.map(String) : [],
      needsReview: Boolean(group.needsReview),
      newSourceId: String(group.newSourceId || group.targetSourceId),
      newSourceName: String(group.newSourceName || group.targetSourceName),
      targetSourceId: group.needsReview
        ? ''
        : String(group.existingSource ? group.targetSourceId : group.newSourceId || group.targetSourceId),
      enabled: true,
    }));
    groupRows.splice(0, groupRows.length, ...rows);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    parsing.value = false;
  }
};

const applyImport = async () => {
  const selected = groupRows.filter((group) => group.enabled);
  if (selected.length === 0) {
    errorMessage.value = t('subPage.smartImport.noSelection');
    return;
  }
  if (selected.some((group) => !group.targetSourceId)) {
    errorMessage.value = t('subPage.smartImport.selectTargetFirst');
    return;
  }
  applying.value = true;
  errorMessage.value = '';
  try {
    const response = await api.applyNodeImport({
      content: content.value,
      groupByRegion: groupByRegion.value,
      groups: selected.map((group) => ({
        id: group.id,
        enabled: true,
        targetSourceId: group.targetSourceId,
        targetSourceName: group.targetSourceId === group.newSourceId ? group.newSourceName : undefined,
      })),
    });
    const data = (response?.data as any)?.data;
    showNotify({
      type: 'success',
      title: t('subPage.smartImport.success', {
        added: Number(data?.added || 0),
        skipped: Number(data?.skipped || 0),
      }),
    });
    emit('imported');
    emit('update:visible', false);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    applying.value = false;
  }
};

watch(groupByRegion, invalidatePreview);
watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    content.value = '';
    fileName.value = '';
    invalidatePreview();
    await loadSources();
  },
);
</script>

<style lang="scss" scoped>
.smart-import-panel {
  height: 100%;
  min-height: 0;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  outline: none;
  color: var(--second-text-color);

  h2 {
    margin: 0;
    color: var(--primary-text-color);
    font-size: 17px;
  }
}

.panel-desc, .group-hint, .target-note, .preview-empty {
  margin: 0;
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 1.6;
}

.source-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: var(--second-text-color);
  font-size: 12px;
}

.source-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 128px;
  padding: 10px;
  resize: vertical;
  border: 1px solid var(--divider-color);
  border-radius: var(--item-card-radios);
  background: var(--background-color);
  color: var(--primary-text-color);
  font-family: inherit;
}

.source-actions, .panel-footer, .group-toggle, .group-enable, .target-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.file-name {
  min-width: 0;
  color: var(--comment-text-color);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-toggle {
  cursor: pointer;
  color: var(--primary-text-color);
  font-size: 13px;
}

.import-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  color: #d93025;
  background: color-mix(in srgb, #d93025 8%, transparent);
  font-size: 12px;
  white-space: pre-wrap;
}

.import-preview {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.preview-summary {
  margin: 0;
  color: var(--primary-text-color);
  font-size: 13px;
  font-weight: 600;
}

.target-note {
  margin-top: -4px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-row {
  padding: 10px;
  border: 1px solid var(--divider-color);
  border-radius: var(--item-card-radios);
  background: var(--background-color);

  &.disabled {
    opacity: 0.5;
  }

  &.needs-review {
    border-color: color-mix(in srgb, var(--primary-color) 34%, var(--divider-color));
  }
}

.review-hint {
  margin: 4px 0 0 22px;
  color: var(--primary-color);
  font-size: 12px;
  line-height: 1.5;
}

.group-enable {
  color: var(--primary-text-color);
  font-weight: 600;
  cursor: pointer;
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  padding-left: 22px;
}

.group-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--comment-text-color);
  font-size: 12px;
}

.target-field {
  font-size: 12px;

  span {
    flex: 0 0 auto;
  }

  select {
    flex: 1;
    min-width: 0;
    min-height: 32px;
    padding: 0 8px;
    border: 1px solid var(--divider-color);
    border-radius: 7px;
    background: var(--card-color);
    color: var(--primary-text-color);
  }
}

.group-samples {
  margin: 0;
  color: var(--comment-text-color);
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.preview-empty {
  flex: 1;
  padding: 24px 0;
  text-align: center;
}

.panel-footer {
  justify-content: flex-end;
  padding-top: 4px;

  .nut-button {
    min-width: 112px;
  }
}

@media screen and (max-width: 720px) {
  .smart-import-panel {
    padding-top: 14px;
  }

  .source-textarea {
    min-height: 112px;
  }

  .group-content {
    padding-left: 0;
  }

  .target-field {
    align-items: flex-start;
    flex-direction: column;
  }

  .target-field select {
    width: 100%;
  }

  .panel-footer {
    .nut-button {
      flex: 1;
    }
  }
}
</style>
