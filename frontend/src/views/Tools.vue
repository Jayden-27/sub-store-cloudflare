<template>
  <div class="tools-page">
    <section class="tool-card">
      <h2>{{ t('toolsPage.converter.title') }}</h2>
      <p>{{ t('toolsPage.converter.desc') }}</p>
      <div class="row">
        <select v-model="conversionKind">
          <option value="proxy">{{ t('toolsPage.converter.proxy') }}</option>
          <option value="rule">{{ t('toolsPage.converter.rule') }}</option>
        </select>
        <select v-model="conversionTarget">
          <option v-for="target in conversionTargets" :key="target" :value="target">{{ target }}</option>
        </select>
      </div>
      <textarea v-model="conversionInput" :placeholder="t('toolsPage.converter.input')" />
      <div class="actions">
        <nut-button type="primary" :loading="converting" @click="runConversion">{{ t('toolsPage.converter.run') }}</nut-button>
        <nut-button plain type="primary" :disabled="!conversionOutput" @click="copyText(conversionOutput)">{{ t('toolsPage.converter.copy') }}</nut-button>
      </div>
      <textarea v-model="conversionOutput" readonly :placeholder="t('toolsPage.converter.output')" />
      <p v-if="conversionStats" class="stats">{{ conversionStats }}</p>
    </section>

    <section class="tool-card">
      <h2>{{ t('toolsPage.upstreamImport.title') }}</h2>
      <p>{{ t('toolsPage.upstreamImport.desc') }}</p>
      <input
        ref="upstreamFileInput"
        type="file"
        accept=".json,.txt,application/json,text/plain"
        @change="onUpstreamFileChange"
      />
      <div class="actions">
        <nut-button plain type="primary" @click="selectUpstreamFile">{{ t('toolsPage.upstreamImport.selectFile') }}</nut-button>
        <nut-button
          type="primary"
          :loading="upstreamImporting"
          :disabled="!upstreamPlan || (upstreamPlan.sources.length === 0 && upstreamPlan.collections.length === 0)"
          @click="applyUpstreamImport"
        >
          {{ t('toolsPage.upstreamImport.apply') }}
        </nut-button>
      </div>
      <p v-if="upstreamError" class="stats is-error">{{ upstreamError }}</p>
      <template v-if="upstreamPlan">
        <p class="stats">
          {{ t('toolsPage.upstreamImport.summary', { sources: upstreamPlan.sources.length, collections: upstreamPlan.collections.length }) }}
        </p>
        <p v-for="warning in upstreamWarnings" :key="warning" class="stats is-warning">{{ warning }}</p>
      </template>
    </section>

    <section class="tool-card">
      <h2>{{ t('toolsPage.shares.title') }}</h2>
      <p>{{ t('toolsPage.shares.desc') }}</p>
      <div class="row share-form">
        <label class="share-field share-field--type">
          <span class="share-field-label">{{ t('toolsPage.shares.resourceType') }}</span>
          <select v-model="shareForm.resourceType" @change="handleShareResourceTypeChange">
            <option value="source">{{ t('toolsPage.shares.source') }}</option>
            <option value="collection">{{ t('toolsPage.shares.collection') }}</option>
          </select>
        </label>
        <label class="share-field share-field--resource">
          <span class="share-field-label">{{ t('toolsPage.shares.resourceId') }}</span>
          <select v-model="shareForm.resourceId" :disabled="shareResourceOptions.length === 0">
            <option value="" disabled hidden>
              {{ shareResourceOptions.length > 0 ? t('toolsPage.shares.resourcePlaceholder') : t('toolsPage.shares.noResources') }}
            </option>
            <option v-for="option in shareResourceOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="share-field share-field--target">
          <span class="share-field-label">{{ t('toolsPage.shares.targetLabel') }}</span>
          <select v-model="shareForm.target">
            <option value="">{{ t('toolsPage.shares.autoTarget') }}</option>
            <option v-for="target in proxyTargets" :key="target" :value="target">{{ target }}</option>
          </select>
        </label>
        <label class="share-field share-field--expiry">
          <span class="share-field-label">
            {{ t('toolsPage.shares.expiresLabel') }}
            <small>{{ t('toolsPage.shares.expiresHint') }}</small>
          </span>
          <input v-model="shareForm.expiresHours" type="number" min="0" max="8760" placeholder="0" />
        </label>
      </div>
      <nut-button type="primary" :loading="shareCreating" :disabled="!shareForm.resourceId" @click="createShare">{{ t('toolsPage.shares.create') }}</nut-button>
      <div v-if="createdShareUrl" class="created-link" @click="copyText(createdShareUrl)">{{ createdShareUrl }}</div>
      <p v-if="shares.length === 0" class="empty">{{ t('toolsPage.shares.empty') }}</p>
      <div v-for="share in shares" :key="share.id" class="list-item">
        <div>
          <strong>{{ share.resourceType }}/{{ share.resourceId }}</strong>
          <small>{{ share.target || 'auto' }} · {{ share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'never' }}</small>
        </div>
        <div class="actions">
          <nut-button plain size="mini" @click="toggleShare(share)">{{ share.enabled ? t('toolsPage.shares.disable') : t('toolsPage.shares.enable') }}</nut-button>
          <nut-button plain type="danger" size="mini" @click="removeShare(share.id)">{{ t('myPage.btn.delete') }}</nut-button>
        </div>
      </div>
    </section>

    <section class="tool-card">
      <h2>{{ t('toolsPage.recycle.title') }}</h2>
      <p>{{ t('toolsPage.recycle.desc') }}</p>
      <p v-if="recycleEntries.length === 0" class="empty">{{ t('toolsPage.recycle.empty') }}</p>
      <div v-for="entry in recycleEntries" :key="entry.id" class="list-item">
        <div>
          <strong>{{ entry.resourceType }}/{{ entry.resourceId }}</strong>
          <small>{{ new Date(entry.deletedAt).toLocaleString() }}</small>
        </div>
        <div class="actions">
          <nut-button plain type="primary" size="mini" @click="restoreEntry(entry.id)">{{ t('toolsPage.recycle.restore') }}</nut-button>
          <nut-button plain type="danger" size="mini" @click="purgeEntry(entry.id)">{{ t('toolsPage.recycle.purge') }}</nut-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCloudflareApi } from '@/api/app';
import { useAppNotifyStore } from '@/store/appNotify';
import { planUpstreamImport, type UpstreamImportPlan } from '@/utils/upstreamImport';

const { t } = useI18n();
const api = useCloudflareApi();
const { showNotify } = useAppNotifyStore();
const upstreamFileInput = ref<HTMLInputElement>();
const upstreamPlan = ref<UpstreamImportPlan | null>(null);
const upstreamError = ref('');
const upstreamImporting = ref(false);
const selectUpstreamFile = () => upstreamFileInput.value?.click();
const upstreamWarnings = computed(() => (upstreamPlan.value?.warnings || []).map((code) => {
  const [key, count] = code.split(':');
  const labels: Record<string, string> = {
    UNSUPPORTED_ACTIONS: t('toolsPage.upstreamImport.warnUnsupported', { count }),
    MISSING_SOURCES: t('toolsPage.upstreamImport.warnMissing', { count }),
    SKIPPED_EXISTING: t('toolsPage.upstreamImport.warnSkipped', { count }),
    TEMPLATE_RESET: t('toolsPage.upstreamImport.warnTemplate', { count }),
  };
  return labels[key] || code;
}));
const onUpstreamFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  upstreamError.value = '';
  try {
    const text = await file.text();
    const [sourcesRes, collectionsRes] = await Promise.all([api.getSources(), api.getCollections()]);
    const existingSources = sourcesRes?.data?.status === 'success' ? sourcesRes.data.data.map((item: any) => item.name) : [];
    const existingCollections = collectionsRes?.data?.status === 'success' ? collectionsRes.data.data.map((item: any) => item.name) : [];
    upstreamPlan.value = planUpstreamImport(text, existingSources, existingCollections);
  } catch (error: any) {
    upstreamPlan.value = null;
    const code = error?.message || '';
    upstreamError.value = code === 'EMPTY'
      ? t('toolsPage.upstreamImport.errorEmpty')
      : code === 'NO_ITEMS'
        ? t('toolsPage.upstreamImport.errorNoItems')
        : t('toolsPage.upstreamImport.errorInvalid');
  }
};
const applyUpstreamImport = async () => {
  const plan = upstreamPlan.value;
  if (!plan) return;
  upstreamImporting.value = true;
  try {
    for (const source of plan.sources) {
      await api.createItem('sub', { ...source, name: source.id, displayName: source.displayName } as any);
    }
    for (const collection of plan.collections) {
      await api.createItem('collection', { ...collection, id: collection.id, name: collection.displayName } as any);
    }
    showNotify({
      type: 'success',
      title: t('toolsPage.upstreamImport.applySucceed', { sources: plan.sources.length, collections: plan.collections.length }),
    });
    upstreamPlan.value = null;
    await loadShares();
  } catch (error: any) {
    showNotify({ type: 'danger', title: t('toolsPage.upstreamImport.applyFailed', { e: error?.response?.data?.error?.message || String(error) }) });
  } finally {
    upstreamImporting.value = false;
  }
};
const proxyTargets = ['mihomo', 'stash', 'surge', 'surge-mac', 'surfboard', 'loon', 'egern', 'shadowrocket', 'qx', 'sing-box', 'v2ray', 'uri', 'json'];
const ruleTargets = ['mihomo', 'surge', 'loon', 'qx'];
const conversionKind = ref<'proxy' | 'rule'>('proxy');
const conversionTarget = ref('mihomo');
const conversionInput = ref('');
const conversionOutput = ref('');
const conversionStats = ref('');
const converting = ref(false);
const shares = ref<any[]>([]);
const recycleEntries = ref<any[]>([]);
const shareCreating = ref(false);
const createdShareUrl = ref('');
const shareForm = reactive({ resourceType: 'source', resourceId: '', target: '', expiresHours: '0' });
const shareResources = reactive({
  source: [] as Array<{ value: string; label: string }>,
  collection: [] as Array<{ value: string; label: string }>,
});
const shareResourceOptions = computed(() => shareResources[shareForm.resourceType as 'source' | 'collection']);
const conversionTargets = computed(() => conversionKind.value === 'proxy' ? proxyTargets : ruleTargets);

const toShareResourceOptions = (items: any[]) => {
  const resources = items.map((item) => {
    const id = String(item.name || item.id || '');
    const displayName = String(item.displayName || id);
    return { value: id, displayName };
  }).filter((item) => item.value);
  const nameCounts = resources.reduce<Record<string, number>>((counts, item) => {
    counts[item.displayName] = (counts[item.displayName] || 0) + 1;
    return counts;
  }, {});
  return resources.map((item) => ({
    value: item.value,
    label: nameCounts[item.displayName] > 1 ? `${item.displayName}（${item.value}）` : item.displayName,
  }));
};

const loadShareResources = async () => {
  const [sourceResponse, collectionResponse] = await Promise.all([api.getSources(), api.getCollections()]);
  const sourceData = (sourceResponse?.data as any)?.data;
  const collectionData = (collectionResponse?.data as any)?.data;
  shareResources.source = Array.isArray(sourceData) ? toShareResourceOptions(sourceData) : [];
  shareResources.collection = Array.isArray(collectionData) ? toShareResourceOptions(collectionData) : [];
};

const handleShareResourceTypeChange = () => {
  shareForm.resourceId = '';
};

const runConversion = async () => {
  converting.value = true;
  try {
    if (!conversionTargets.value.includes(conversionTarget.value)) conversionTarget.value = conversionTargets.value[0];
    const response = conversionKind.value === 'proxy'
      ? await api.convertProxies({ content: conversionInput.value, target: conversionTarget.value })
      : await api.convertRules({ content: conversionInput.value, target: conversionTarget.value });
    const data = (response?.data as any)?.data;
    conversionOutput.value = String(data?.content || data?.par_res || '');
    conversionStats.value = `parsed ${data?.parsed || 0} · emitted ${data?.emitted || 0} · skipped ${data?.skipped || 0}`;
    showNotify({ type: 'success', title: t('toolsPage.notify.converted') });
  } catch (error) {
    notifyError(error);
  } finally {
    converting.value = false;
  }
};

const loadShares = async () => {
  const response = await api.getShares();
  const data = (response?.data as any)?.data;
  shares.value = Array.isArray(data) ? data : [];
};
const loadRecycle = async () => {
  const response = await api.getRecycleBin();
  const data = (response?.data as any)?.data;
  recycleEntries.value = Array.isArray(data) ? data : [];
};
const createShare = async () => {
  shareCreating.value = true;
  try {
    const response = await api.createShare({
      resourceType: shareForm.resourceType,
      resourceId: shareForm.resourceId,
      target: shareForm.target || undefined,
      expiresIn: Math.max(0, Number(shareForm.expiresHours) || 0) * 3600,
    });
    createdShareUrl.value = String((response?.data as any)?.data?.url || '');
    await loadShares();
    showNotify({ type: 'success', title: t('toolsPage.notify.shareCreated') });
  } catch (error) {
    notifyError(error);
  } finally {
    shareCreating.value = false;
  }
};
const toggleShare = async (share: any) => { await api.updateShare(share.id, { enabled: !share.enabled }); await loadShares(); };
const removeShare = async (id: string) => { await api.deleteShare(id); await Promise.all([loadShares(), loadRecycle()]); };
const restoreEntry = async (id: string) => { await api.restoreRecycleEntry(id); await loadRecycle(); };
const purgeEntry = async (id: string) => { await api.deleteRecycleEntry(id); await loadRecycle(); };
const copyText = async (value: string) => { await navigator.clipboard.writeText(value); showNotify({ type: 'success', title: t('toolsPage.notify.copied') }); };
const notifyError = (error: unknown) => showNotify({ type: 'danger', title: t('toolsPage.notify.failed', { e: error instanceof Error ? error.message : String(error) }) });

onMounted(() => Promise.all([loadShares(), loadRecycle(), loadShareResources()]));
</script>

<style lang="scss" scoped>
.tools-page { min-height: 100%; padding: var(--safe-area-side); display: flex; flex-direction: column; gap: 10px; }
.tool-card { padding: 16px; border-radius: var(--item-card-radios); background: var(--card-color); color: var(--second-text-color); }
h2 { margin: 0; color: var(--primary-text-color); font-size: 16px; }
p { color: var(--comment-text-color); font-size: 12px; line-height: 1.6; }
.row { display: flex; gap: 8px; margin-bottom: 8px; }
select, input, textarea { box-sizing: border-box; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--background-color); color: var(--primary-text-color); }
select, input { min-height: 38px; padding: 0 10px; }
textarea { width: 100%; min-height: 150px; padding: 10px; resize: vertical; font-family: monospace; }
.actions { display: flex; gap: 8px; margin: 8px 0; }
.share-form { flex-wrap: wrap; align-items: flex-end; row-gap: 10px; }
.share-field { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.share-field select, .share-field input { width: 100%; }
.share-field--type { flex: 0 0 120px; }
.share-field--resource { flex: 1 1 220px; }
.share-field--target { flex: 0 0 150px; }
.share-field--expiry { flex: 0 0 190px; }
.share-field-label { display: flex; align-items: baseline; gap: 6px; color: var(--comment-text-color); font-size: 12px; }
.share-field-label small { font-size: 11px; color: var(--comment-text-color); }
.created-link { margin: 10px 0; padding: 10px; border-radius: 8px; background: var(--background-color); overflow-wrap: anywhere; cursor: copy; font-size: 12px; }
.list-item { min-height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--divider-color); }
.list-item div:first-child { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.list-item strong { color: var(--primary-text-color); font-size: 13px; overflow-wrap: anywhere; }
.list-item small, .stats, .empty { color: var(--comment-text-color); }
.stats.is-error { color: var(--danger-color, #ff4444); }
.stats.is-warning { color: #d48806; }
@media (max-width: 720px) { .share-form { flex-direction: column; align-items: stretch; } .share-field { flex-basis: auto; } }
@media (max-width: 520px) { .row { flex-direction: column; } .list-item { align-items: flex-start; flex-direction: column; padding: 10px 0; } }
</style>
