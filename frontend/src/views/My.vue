<template>
  <div class="my-page-wrapper">
    <section class="profile-block">
      <div class="radio-wrapper">
        <span class="tag current">{{ env.runtime || env.backend || "Cloudflare" }}</span>
        <div class="storage-language-switch">
          <LanguageSwitcherButton />
        </div>
      </div>
      <div class="info">
        <div class="avatar-wrapper">
          <nut-avatar
            size="72"
            bg-color="var(--card-color)"
            :url="icon"
            class="auto-reverse"
          />
          <div class="name">
            <p class="title">{{ appName }}</p>
            <p class="des">
              <span class="des-line1">{{ t("myPage.profile.desc") }}</span>
              <span class="des-line2">{{ env.storage || "D1" }} · v{{ env.version || "-" }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="config-card storage-card">
      <div class="title-wrapper">
        <h1>{{ t("myPage.backup.title") }}</h1>
        <div class="storage-actions">
          <input ref="fileInput" type="file" accept="application/json,.json" @change="restoreFromFile" />
          <nut-button plain type="primary" size="small" :loading="restoreIsLoading" @click="selectBackupFile">
            <font-awesome-icon v-if="!restoreIsLoading" icon="fa-solid fa-cloud-arrow-up" />
            {{ t("myPage.backup.restore") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="exportIsLoading" @click="exportBackup">
            <font-awesome-icon v-if="!exportIsLoading" icon="fa-solid fa-cloud-arrow-down" />
            {{ t("myPage.backup.export") }}
          </nut-button>
        </div>
      </div>
      <p class="card-desc">{{ t("myPage.backup.desc") }}</p>
    </section>

    <section class="config-card">
      <div class="title-wrapper">
        <h1>{{ t("myPage.templates.title") }}</h1>
        <div class="storage-actions">
          <input ref="templateFileInput" type="file" accept="application/json,.json,.yaml,.yml,text/yaml" @change="importTemplateFromFile" />
          <nut-button plain type="primary" size="small" :loading="templateImporting" @click="selectTemplateFile">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-file-import" />
            {{ t("myPage.templates.importFile") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="templateImporting" @click="openTemplateImport">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-plus" />
            {{ t("myPage.templates.create") }}
          </nut-button>
        </div>
      </div>
      <p
        v-if="templateSyncSummary"
        class="template-sync-summary"
        :class="{ 'is-error': templateSyncSummary.failed > 0 }"
      >
        <font-awesome-icon
          v-if="templateSyncSummary.failed > 0"
          icon="fa-solid fa-circle-exclamation"
        />
        {{ templateSyncSummary.text }}
      </p>
      <div class="template-list">
        <div v-for="template in templates" :key="template.name" class="template-item">
          <div class="template-text">
            <span class="template-title">{{ template.displayName || template.name }}</span>
            <span class="template-meta" :class="{ 'is-error': Boolean(template.syncError) }">
              {{ templateStatusLabel(template) }}
              · {{ getTargetLabel(template.target || "mihomo") }}
            </span>
          </div>
          <div class="template-actions">
            <nut-button v-if="template.remoteUrl" plain type="primary" size="mini" @click="syncTemplate(template)">
              {{ t("myPage.templates.sync") }}
            </nut-button>
            <nut-button plain type="default" size="mini" @click="openTemplateEdit(template)">
              {{ t("myPage.btn.edit") }}
            </nut-button>
            <nut-button plain type="default" size="mini" @click="openTemplateActions(template)">
              {{ t("myPage.templates.more") }}
            </nut-button>
          </div>
        </div>
      </div>
    </section>

    <section class="config-card">
      <div class="title-wrapper" @click="requestEditing ? cancelRequestEdit() : startRequestEdit()">
        <h1>{{ t("myPage.request.title") }}</h1>
        <div class="config-btn-wrapper">
          <template v-if="requestEditing">
            <nut-button class="cancel-btn" plain type="info" size="mini" :disabled="requestSaving" @click.stop="cancelRequestEdit">
              <font-awesome-icon icon="fa-solid fa-ban" />
              {{ t("myPage.btn.cancel") }}
            </nut-button>
            <nut-button class="save-btn" type="primary" size="mini" :loading="requestSaving" :disabled="!isRequestValid" @click.stop="saveRequestSettings">
              <font-awesome-icon v-if="!requestSaving" icon="fa-solid fa-floppy-disk" />
              {{ t("myPage.btn.save") }}
            </nut-button>
          </template>
          <nut-icon v-else class="right-icon" name="right"></nut-icon>
        </div>
      </div>
      <div v-if="requestEditing" class="config-input-wrapper">
        <Field :label="t('myPage.request.defaultUserAgent')">
          <TextInput v-model="requestForm.defaultUserAgent" />
        </Field>
        <Field :label="t('myPage.request.defaultFlowUserAgent')">
          <TextInput v-model="requestForm.defaultFlowUserAgent" />
        </Field>
        <Field :label="t('myPage.request.defaultTimeout')" :error="requestFieldErrors.defaultTimeout">
          <NumberInput v-model="requestForm.defaultTimeout" />
        </Field>
        <Field :label="t('myPage.request.backendRequestConcurrency')" :error="requestFieldErrors.backendRequestConcurrency">
          <NumberInput v-model="requestForm.backendRequestConcurrency" />
        </Field>
        <Field :label="t('myPage.request.backendRequestConcurrencyWaitTime')" :error="requestFieldErrors.backendRequestConcurrencyWaitTime">
          <NumberInput v-model="requestForm.backendRequestConcurrencyWaitTime" />
        </Field>
        <Field :label="t('myPage.request.remoteCacheTtl')" :error="requestFieldErrors.remoteCacheTtl">
          <NumberInput v-model="requestForm.remoteCacheTtl" />
        </Field>
        <Field :label="t('myPage.request.nodeInfoApiUrl')" :error="requestFieldErrors.nodeInfoApiUrl">
          <TextInput v-model="requestForm.nodeInfoApiUrl" type="url" inputmode="url" mono />
        </Field>
        <CheckRow v-model="requestForm.remoteCacheStaleOnError" :label="t('myPage.request.remoteCacheStaleOnError')" />
      </div>
      <p v-else class="card-desc">{{ requestSummary }}</p>
    </section>

    <nut-popup
      :visible="templateImportVisible"
      :position="isWideScreen ? 'center' : 'bottom'"
      :style="templatePopupStyle"
      :z-index="1900"
      round
      closeable
      @update:visible="onTemplateVisibleChange"
    >
      <div
        class="template-import-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="templateDialogTitle"
        tabindex="-1"
        data-dialog-focus
      >
        <h2>{{ templateDialogTitle }}</h2>
        <div class="template-form">
          <Field :label="t('myPage.templates.idLabel')">
            <TextInput
              v-if="!templateEditingId"
              v-model="templateForm.id"
              :placeholder="t('myPage.templates.idPlaceholder')"
            />
            <span v-else class="template-form__value is-muted">{{ templateForm.id }}</span>
          </Field>
          <Field :label="t('myPage.templates.nameLabel')">
            <TextInput v-model="templateForm.name" :placeholder="t('myPage.templates.namePlaceholder')" />
          </Field>
          <div class="template-form__row" :class="{ 'is-clickable': !isWideScreen }" @click="!isWideScreen && openTemplateTargetPicker()">
            <span class="template-form__label">{{ t("myPage.templates.target") }}</span>
            <div v-if="isWideScreen" class="template-target-options" role="radiogroup" :aria-label="t('myPage.templates.target')">
              <button
                v-for="option in TEMPLATE_TARGET_OPTIONS"
                :key="option.value"
                type="button"
                class="template-target-option"
                :class="{ current: templateForm.target === option.value }"
                role="radio"
                :aria-checked="templateForm.target === option.value"
                @click.stop="setTemplateTarget(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
            <span v-else class="template-form__value">
              {{ templateTargetLabel }}
              <nut-icon name="rect-right" size="12px" />
            </span>
          </div>
          <Field :label="t('myPage.templates.remoteUrl')">
            <TextInput v-model="templateForm.remoteUrl" :placeholder="t('myPage.templates.remoteUrlPlaceholder')" />
          </Field>
        </div>
        <div class="template-content-editor">
          <CmView v-if="templateImportVisible" :is-read-only="false" :language="templateEditorLanguage" id="TemplateEditor" />
        </div>
        <nut-button block type="primary" :loading="templateImporting" @click="saveTemplate">
          {{ t("myPage.templates.save") }}
        </nut-button>
      </div>
    </nut-popup>
    <nut-popup
      :visible="sourceViewVisible"
      :position="isWideScreen ? 'center' : 'bottom'"
      :style="templatePopupStyle"
      :z-index="1900"
      round
      closeable
      @update:visible="(value: boolean) => (sourceViewVisible = value)"
    >
      <div
        class="template-import-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="t('myPage.templates.sourceTitle')"
      >
        <h2>{{ t("myPage.templates.sourceTitle") }}</h2>
        <p v-if="sourceViewUrl" class="template-source-url">{{ sourceViewUrl }}</p>
        <p v-if="sourceViewError" class="template-source-error">{{ sourceViewError }}</p>
        <div class="template-content-editor">
          <CmView v-if="sourceViewVisible" :is-read-only="true" :language="sourceViewLanguage" id="TemplateSourceView" />
        </div>
      </div>
    </nut-popup>
    <nut-popup
      v-model:visible="templateActionVisible"
      position="bottom"
      round
      :style="{ padding: '12px 12px calc(12px + env(safe-area-inset-bottom))' }"
      z-index="1900"
    >
      <div class="template-action-menu">
        <p class="template-action-menu__title">{{ templateActionTitle }}</p>
        <button
          v-for="item in templateActionItems"
          :key="item.value"
          class="template-action-menu__item"
          @click="onTemplateActionChoose(item)"
        >
          {{ item.text }}
        </button>
        <button class="template-action-menu__item is-cancel" @click="templateActionVisible = false">
          {{ t("myPage.btn.cancel") }}
        </button>
      </div>
    </nut-popup>
    <DesktopPicker
      v-model="selectedTemplateTargetValue"
      v-model:visible="templateTargetPickerVisible"
      :columns="templateTargetColumns"
      :title="t('myPage.templates.targetPickerTitle')"
      :cancel-text="t('myPage.btn.cancel')"
      :ok-text="t('specificWord.confirm')"
      @confirm="handleTemplateTargetConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Dialog } from "@nutui/nutui";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, useRouter } from "vue-router";

import { useCloudflareApi } from "@/api/app";
import { CheckRow, Field, NumberInput, TextInput } from "@/ui";
import { butifyDate } from "@/utils/butifyDate";
import { friendlyError } from "@/utils/friendlyError";
import LanguageSwitcherButton from "@/components/LanguageSwitcherButton.vue";
import DesktopPicker from "@/components/DesktopPicker.vue";
import { useSettingsApi } from "@/api/settings";
import { useBackend } from "@/hooks/useBackend";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { useAppNotifyStore } from "@/store/appNotify";
import { useCodeStore } from "@/store/codeStore";
import { useSettingsStore } from "@/store/settings";
import { TEMPLATE_TARGET_OPTIONS, getTargetLabel } from "@/constants/subscriptionTargets";
import { stringify as toYaml } from "yaml";

const CmView = defineAsyncComponent(() => import("@/views/editCode/cmView.vue"));

const settingsStore = useSettingsStore();
const settingsApi = useSettingsApi();
const cloudflareApi = useCloudflareApi();
const cmStore = useCodeStore();
const { isWideScreen } = useWideScreenNarrowMode();
const { showNotify } = useAppNotifyStore();
const { t, locale } = useI18n();
const router = useRouter();
const { icon, env } = useBackend();
const TEMPLATE_EDITOR_ID = "TemplateEditor";

const fileInput = ref<HTMLInputElement | null>(null);
const templateFileInput = ref<HTMLInputElement | null>(null);
const restoreIsLoading = ref(false);
const exportIsLoading = ref(false);
const requestEditing = ref(false);
const requestSaving = ref(false);
const templateImporting = ref(false);
const templateImportVisible = ref(false);
const templateEditingId = ref("");
const templateFromFile = ref(false);
const templateTargetPickerVisible = ref(false);
const templateEditorLanguage = ref<"yaml" | "json">("yaml");
const templates = ref<any[]>([]);
const templateDialogTitle = computed(() => {
  if (templateEditingId.value) return t("myPage.templates.editTitle");
  return templateFromFile.value ? t("myPage.templates.importTitle") : t("myPage.templates.createTitle");
});
const templatePopupStyle = computed(() => (isWideScreen.value
  ? { width: "800px", maxWidth: "92vw", height: "80vh" }
  : { height: "82vh" }));

const templateEditorContent = () => String(cmStore.EditCode[TEMPLATE_EDITOR_ID] || "");
const templateState = () => JSON.stringify({
  id: templateForm.id,
  name: templateForm.name,
  target: templateForm.target,
  content: templateEditorContent(),
});
const templateSnapshot = ref("");
const captureTemplateSnapshot = () => {
  templateSnapshot.value = templateState();
};
const isTemplateDirty = () => templateSnapshot.value !== templateState();
const templateCloseAllowed = ref(false);
const closeTemplateDialog = () => {
  templateCloseAllowed.value = true;
  templateImportVisible.value = false;
  templateEditingId.value = "";
};
const onTemplateVisibleChange = (visible: boolean) => {
  if (visible) {
    templateCloseAllowed.value = false;
    templateImportVisible.value = true;
    return;
  }
  if (templateCloseAllowed.value) return;
  if (!isTemplateDirty()) {
    closeTemplateDialog();
    return;
  }
  Dialog({
    title: t("myPage.unsaved.title"),
    content: t("myPage.unsaved.content"),
    popClass: "auto-dialog",
    okText: t("myPage.unsaved.discard"),
    cancelText: t("myPage.unsaved.keep"),
    closeOnClickOverlay: true,
    onOk: closeTemplateDialog,
  });
};

const requestForm = reactive({
  defaultUserAgent: "",
  defaultFlowUserAgent: "",
  defaultTimeout: "",
  backendRequestConcurrency: "",
  backendRequestConcurrencyWaitTime: "",
  remoteCacheTtl: "",
  remoteCacheStaleOnError: true,
  nodeInfoApiUrl: "",
});
const templateForm = reactive({
  id: "",
  name: "",
  target: "mihomo",
  remoteUrl: "",
});
const selectedTemplateTargetValue = ref<string[]>([]);
const templateTargetColumns = computed(() => {
  return TEMPLATE_TARGET_OPTIONS.map((option) => ({
    text: option.label,
    value: option.value,
  }));
});
const templateTargetLabel = computed(() => {
  return getTargetLabel(templateForm.target);
});
const appName = computed(() => {
  return env.value?.app
    || env.value?.meta?.cloudflare?.env?.SUB_STORE_BACKEND_CUSTOM_NAME
    || "Sub-Store Cloudflare";
});
const requestSummary = computed(() => {
  return t("myPage.request.summary", {
    concurrency: settingsStore.backendRequestConcurrency || "3",
    timeout: settingsStore.defaultTimeout || "30000",
  });
});

const rangeError = (value: string, labelKey: string, min: number, max: number) => {
  const text = String(value ?? "").trim();
  const number = Number(text);
  if (/^\d+$/.test(text) && number >= min && number <= max) return "";
  return t("myPage.request.validation.range", { label: t(labelKey), min, max });
};
const requestFieldErrors = computed<Record<string, string>>(() => {
  const errors: Record<string, string> = {};
  const setError = (key: string, message: string) => {
    if (message) errors[key] = message;
  };
  setError("defaultTimeout", rangeError(requestForm.defaultTimeout, "myPage.request.defaultTimeout", 1000, 120000));
  setError("backendRequestConcurrency", rangeError(requestForm.backendRequestConcurrency, "myPage.request.backendRequestConcurrency", 1, 12));
  setError("backendRequestConcurrencyWaitTime", rangeError(requestForm.backendRequestConcurrencyWaitTime, "myPage.request.backendRequestConcurrencyWaitTime", 0, 5000));
  setError("remoteCacheTtl", rangeError(requestForm.remoteCacheTtl, "myPage.request.remoteCacheTtl", 0, 3600));
  const nodeInfoApiUrl = String(requestForm.nodeInfoApiUrl || "").trim();
  if (!/^https:\/\/\S+$/i.test(nodeInfoApiUrl) || !nodeInfoApiUrl.includes("{ip}")) {
    errors.nodeInfoApiUrl = t("myPage.request.validation.nodeInfoApiUrl");
  }
  return errors;
});
const isRequestValid = computed(() => Object.keys(requestFieldErrors.value).length === 0);

const syncRequestForm = () => {
  requestForm.defaultUserAgent = settingsStore.defaultUserAgent || "";
  requestForm.defaultFlowUserAgent = settingsStore.defaultFlowUserAgent || "";
  requestForm.defaultTimeout = settingsStore.defaultTimeout || "";
  requestForm.backendRequestConcurrency = settingsStore.backendRequestConcurrency || "";
  requestForm.backendRequestConcurrencyWaitTime = settingsStore.backendRequestConcurrencyWaitTime || "";
  requestForm.remoteCacheTtl = settingsStore.remoteCacheTtl || "300";
  requestForm.remoteCacheStaleOnError = settingsStore.remoteCacheStaleOnError !== false;
  requestForm.nodeInfoApiUrl = settingsStore.nodeInfoApiUrl || "https://ipwho.is/{ip}";
};

const requestSnapshot = ref("");
const startRequestEdit = () => {
  syncRequestForm();
  requestSnapshot.value = JSON.stringify(requestForm);
  requestEditing.value = true;
};

const cancelRequestEdit = () => {
  if (JSON.stringify(requestForm) !== requestSnapshot.value) {
    Dialog({
      title: t("myPage.unsaved.title"),
      content: t("myPage.unsaved.content"),
      popClass: "auto-dialog",
      okText: t("myPage.unsaved.discard"),
      cancelText: t("myPage.unsaved.keep"),
      closeOnClickOverlay: true,
      onOk: () => {
        syncRequestForm();
        requestEditing.value = false;
      },
    });
    return;
  }
  syncRequestForm();
  requestEditing.value = false;
};

const saveRequestSettings = async () => {
  if (!isRequestValid.value) return;
  requestSaving.value = true;
  try {
    const saved = await settingsStore.changeSettings({ ...requestForm });
    if (saved) requestSnapshot.value = JSON.stringify(requestForm);
    requestEditing.value = !saved;
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.request.saveFailed", { e: errorMessage(error) }) });
  } finally {
    requestSaving.value = false;
  }
};

const selectBackupFile = () => {
  fileInput.value?.click();
};

const exportBackup = async () => {
  exportIsLoading.value = true;
  try {
    const response = await settingsApi.downloadBackup();
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `sub-store-cloudflare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.notify.backup.failedWithError", { e: errorMessage(error) }) });
  } finally {
    exportIsLoading.value = false;
  }
};

const fetchTemplates = async () => {
  const res = await cloudflareApi.getTemplates();
  if (res?.data?.status === "success" && Array.isArray(res.data.data)) {
    templates.value = res.data.data;
  }
};

const selectTemplateFile = () => {
  templateFileInput.value?.click();
};

const openTemplateImport = () => {
  templateEditingId.value = "";
  templateFromFile.value = false;
  templateForm.id = "";
  templateForm.name = "";
  templateForm.target = "mihomo";
  templateForm.remoteUrl = "";
  templateEditorLanguage.value = "yaml";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, "");
  templateImportVisible.value = true;
  captureTemplateSnapshot();
};

const openTemplateEdit = (template: any) => {
  templateEditingId.value = template.name;
  templateFromFile.value = false;
  templateForm.id = template.name;
  templateForm.name = template.displayName || template.name;
  templateForm.target = template.target || "mihomo";
  templateForm.remoteUrl = template.remoteUrl || "";
  const isSingBox = templateForm.target === "sing-box";
  templateEditorLanguage.value = isSingBox ? "json" : "yaml";
  cmStore.setEditCode(
    TEMPLATE_EDITOR_ID,
    isSingBox ? JSON.stringify(template.config || {}, null, 2) : toYaml(template.config || {}),
  );
  templateImportVisible.value = true;
  captureTemplateSnapshot();
};

const importTemplateFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  templateEditingId.value = "";
  templateFromFile.value = true;
  templateForm.id = file.name.replace(/\.(json|ya?ml)$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  templateForm.name = file.name.replace(/\.(json|ya?ml)$/i, "");
  templateForm.target = "mihomo";
  templateForm.remoteUrl = "";
  const content = await file.text();
  templateEditorLanguage.value = /^[{[]/.test(content.trim()) ? "json" : "yaml";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, content);
  templateImportVisible.value = true;
  captureTemplateSnapshot();
};

const openTemplateTargetPicker = () => {
  selectedTemplateTargetValue.value = [templateForm.target || "mihomo"];
  templateTargetPickerVisible.value = true;
};

const setTemplateTarget = (target: string) => {
  templateForm.target = target || "mihomo";
  selectedTemplateTargetValue.value = [templateForm.target];
  templateEditorLanguage.value = templateForm.target === "sing-box" ? "json" : "yaml";
  templateTargetPickerVisible.value = false;
};

const handleTemplateTargetConfirm = ({ selectedValue }) => {
  setTemplateTarget(selectedValue?.[0]);
};

const saveTemplate = async () => {
  const content = String(cmStore.EditCode[TEMPLATE_EDITOR_ID] || "");
  if (!templateForm.id || !content.trim()) {
    showNotify({ type: "danger", title: t("myPage.templates.validationRequired") });
    return;
  }

  templateImporting.value = true;
  try {
    const payload = {
      id: templateForm.id.trim(),
      name: (templateForm.name || templateForm.id).trim(),
      target: templateForm.target,
      content,
      remoteUrl: templateForm.remoteUrl.trim(),
    };
    const res = templateEditingId.value
      ? await cloudflareApi.updateTemplate(templateEditingId.value, payload)
      : await cloudflareApi.createTemplate(payload);
    if (res?.data?.status !== "success") throw new Error("import failed");
    await fetchTemplates();
    closeTemplateDialog();
    showNotify({ type: "success", title: t("myPage.templates.saveSucceed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.templates.saveFailed", { e: errorMessage(error) }) });
  } finally {
    templateImporting.value = false;
  }
};

const templateStatusLabel = (template: any) => {
  if (template.syncError) return t("myPage.templates.status.failed");
  if (!template.builtin) return t("myPage.templates.status.custom");
  if (template.dirty) return t("myPage.templates.status.modified");
  if (template.lastSyncedAt) return t("myPage.templates.status.synced");
  return t("myPage.templates.status.default");
};

const templateSyncSummary = computed(() => {
  const failed = templates.value.filter((item: any) => Boolean(item.syncError)).length;
  if (failed > 0) {
    return { failed, text: t("myPage.templates.syncSummaryFailed", { count: failed }) };
  }
  const times = templates.value
    .map((item: any) => Number(item.lastSyncedAt) || 0)
    .filter((value: number) => value > 0);
  if (times.length === 0) return null;
  return { failed: 0, text: t("myPage.templates.syncSummaryOk", { time: butifyDate(Math.max(...times)) }) };
});

const templateActionVisible = ref(false);
const templateActionTarget = ref<any>(null);
const templateActionTitle = computed(() =>
  templateActionTarget.value ? templateActionTarget.value.displayName || templateActionTarget.value.name : "",
);
const templateActionItems = computed(() => {
  const template = templateActionTarget.value;
  if (!template) return [];
  const items: Array<{ text: string; value: string }> = [];
  if (template.remoteUrl) items.push({ text: t("myPage.templates.viewSource"), value: "view" });
  if (template.builtin) items.push({ text: t("myPage.templates.reset"), value: "reset" });
  items.push({ text: t("myPage.templates.deleteAction"), value: "delete" });
  return items;
});
const openTemplateActions = (template: any) => {
  templateActionTarget.value = template;
  templateActionVisible.value = true;
};
const onTemplateActionChoose = (item: { value?: string }) => {
  const template = templateActionTarget.value;
  templateActionVisible.value = false;
  if (!template) return;
  if (item?.value === "view") void viewTemplateSource(template);
  else if (item?.value === "reset") resetTemplate(template);
  else if (item?.value === "delete") void deleteCustomTemplate(template.name);
};

const getTemplateReferences = async (name: string) => {
  try {
    const res = await cloudflareApi.getCollections();
    const collections = res?.data?.status === "success" && Array.isArray(res.data.data) ? res.data.data : [];
    return collections
      .filter((collection) => collection.templateId === name)
      .map((collection) => ({
        id: collection.name,
        label: collection.displayName || collection.name || collection.id,
      }));
  } catch {
    return [];
  }
};

const deleteCustomTemplate = async (name: string) => {
  const references = await getTemplateReferences(name);
  if (references.length > 0) {
    Dialog({
      title: t("myPage.templates.deleteBlockedTitle"),
      content: t("myPage.templates.deleteBlockedContent", {
        name,
        collections: references.map((item) => item.label).join(locale.value.startsWith("zh") ? "、" : ", "),
      }),
      popClass: "auto-dialog",
      okText: t("myPage.templates.deleteBlockedGo"),
      cancelText: t("myPage.btn.cancel"),
      closeOnClickOverlay: true,
      onOk: () => {
        router.push(`/edit/collections/${encodeURIComponent(references[0].id)}`);
      },
    });
    return;
  }

  Dialog({
    title: t("myPage.templates.deleteTitle"),
    content: t("myPage.templates.deleteContent", { name }),
    popClass: "auto-dialog",
    okText: t("myPage.btn.delete"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      try {
        const res = await cloudflareApi.deleteTemplate(name);
        if (res?.data?.status !== "success") throw new Error("delete failed");
        await fetchTemplates();
        showNotify({ type: "success", title: t("myPage.templates.deleteSucceed") });
      } catch (error) {
        showNotify({ type: "danger", title: t("myPage.templates.deleteFailed", { e: errorMessage(error) }) });
      }
    },
  });
};

const resetTemplate = (template: any) => {
  Dialog({
    title: t("myPage.templates.resetTitle"),
    content: t("myPage.templates.resetContent", { name: template.displayName || template.name }),
    popClass: "auto-dialog",
    okText: t("myPage.templates.reset"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      try {
        const res = await cloudflareApi.resetTemplate(template.name);
        if (res?.data?.status !== "success") throw new Error("reset failed");
        await fetchTemplates();
        showNotify({ type: "success", title: t("myPage.templates.resetSucceed") });
      } catch (error) {
        showNotify({ type: "danger", title: t("myPage.templates.resetFailed", { e: errorMessage(error) }) });
      }
    },
  });
};

const syncTemplate = async (template: any, force = false) => {
  try {
    const res = await cloudflareApi.syncTemplate(template.name, force);
    if (res?.data?.status !== "success") throw new Error("sync failed");
    await fetchTemplates();
    showNotify({ type: "success", title: t("myPage.templates.syncSucceed") });
  } catch (error: any) {
    if (error?.response?.status === 409 && !force) {
      Dialog({
        title: t("myPage.templates.syncConflictTitle"),
        content: t("myPage.templates.syncConflictContent", { name: template.displayName || template.name }),
        popClass: "auto-dialog",
        okText: t("myPage.templates.sync"),
        cancelText: t("myPage.btn.cancel"),
        closeOnClickOverlay: true,
        onOk: () => syncTemplate(template, true),
      });
      return;
    }
    const message = error?.response?.data?.error?.message || errorMessage(error);
    showNotify({ type: "danger", title: t("myPage.templates.syncFailed", { e: message }) });
  }
};

const TEMPLATE_SOURCE_VIEW_ID = "TemplateSourceView";
const sourceViewVisible = ref(false);
const sourceViewUrl = ref("");
const sourceViewError = ref("");
const sourceViewLanguage = ref<"yaml" | "json">("yaml");

const viewTemplateSource = async (template: any) => {
  sourceViewVisible.value = true;
  sourceViewUrl.value = template.remoteUrl || "";
  sourceViewError.value = "";
  sourceViewLanguage.value = "yaml";
  cmStore.setEditCode(TEMPLATE_SOURCE_VIEW_ID, "");
  try {
    const res = await cloudflareApi.getTemplateSource(template.name);
    const payload = res?.data;
    if (!payload || payload.status !== "success") {
      throw new Error(payload?.status === "failed" ? payload.error.message : "load failed");
    }
    const data = payload.data as { url?: string; content?: string };
    sourceViewUrl.value = data.url || sourceViewUrl.value;
    const content = data.content || "";
    sourceViewLanguage.value = /^[{[]/.test(content.trim()) ? "json" : "yaml";
    cmStore.setEditCode(TEMPLATE_SOURCE_VIEW_ID, content);
  } catch (error: any) {
    sourceViewError.value = error?.response?.data?.error?.message || errorMessage(error);
  }
};

const syncTemplatesLazy = async () => {  try {
    const res = await cloudflareApi.syncTemplates();
    const payload = res?.data;
    if (!payload || payload.status !== "success") return;
    const synced = (payload.data as any)?.synced;
    if (Array.isArray(synced) && synced.some((item: any) => item.status === "updated" || item.status === "error")) {
      await fetchTemplates();
    }
  } catch {
    // Lazy sync is best-effort; the manual button surfaces errors.
  }
};

const restoreFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  let content = "";
  let payload: Record<string, unknown> = {};
  try {
    content = await file.text();
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid backup");
    payload = parsed as Record<string, unknown>;
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.backup.restoreInvalid", { e: errorMessage(error) }) });
    return;
  }

  const count = (key: string) => Array.isArray(payload[key]) ? (payload[key] as unknown[]).length : 0;
  Dialog({
    title: t("myPage.backup.restoreTitle"),
    content: t("myPage.backup.restoreSummary", {
      file: file.name,
      sources: count("sources"),
      collections: count("collections"),
      templates: count("templates"),
    }),
    popClass: "auto-dialog",
    okText: t("myPage.backup.restore"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      restoreIsLoading.value = true;
      try {
        const res = await settingsApi.restoreSettings({ content });
        if (res?.data?.status !== "success") throw new Error("restore failed");
        await settingsStore.fetchSettings();
        showNotify({ type: "success", title: t("myPage.notify.restore.succeed") });
      } catch (error) {
        showNotify({ type: "danger", title: t("myPage.notify.restore.failedWithError", { e: errorMessage(error) }) });
      } finally {
        restoreIsLoading.value = false;
      }
    },
  });
};

const errorMessage = (error: unknown) => friendlyError(error);

const hasUnsavedChanges = computed(() => {
  const templateDirty = templateImportVisible.value && isTemplateDirty();
  const requestDirty = requestEditing.value && JSON.stringify(requestForm) !== requestSnapshot.value;
  return templateDirty || requestDirty;
});
const navigationPromptOpen = ref(false);
const navigationUnlocked = ref(false);
onBeforeRouteLeave((to) => {
  if (navigationUnlocked.value) return true;
  if (!hasUnsavedChanges.value || to.path === router.currentRoute.value.path) return true;
  if (navigationPromptOpen.value) return false;
  navigationPromptOpen.value = true;
  Dialog({
    title: t("myPage.unsaved.title"),
    content: t("myPage.unsaved.content"),
    popClass: "auto-dialog",
    okText: t("myPage.unsaved.discard"),
    cancelText: t("myPage.unsaved.keep"),
    closeOnClickOverlay: false,
    onOk: () => {
      navigationPromptOpen.value = false;
      navigationUnlocked.value = true;
      router.push(to.fullPath);
    },
    onCancel: () => {
      navigationPromptOpen.value = false;
    },
  });
  return false;
});

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges.value) return;
  event.preventDefault();
  event.returnValue = "";
};

onMounted(() => {
  fetchTemplates();
  void syncTemplatesLazy();
  window.addEventListener("beforeunload", onBeforeUnload);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
});
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100%;
  padding: var(--safe-area-side);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.profile-block {
  width: 100%;

  .radio-wrapper {
    display: flex;
    align-items: center;

    .tag {
      margin: 0;
      padding: 3px 8px;
      flex-shrink: 0;
      border: 1px solid var(--ui-border);
      border-radius: var(--ui-radius-sm);
      background: var(--ui-surface-card);
      color: var(--ui-text-tertiary);
      font-size: 11px;
      letter-spacing: 0.02em;
      user-select: none;
    }

    .current {
      border-bottom: 0;
      color: var(--ui-text-tertiary);
    }

    .storage-language-switch {
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .info {
    width: 100%;
    margin-bottom: 10px;
    padding: 12px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .avatar-wrapper {
    min-width: 0;
    max-width: 100%;
    display: flex;
    align-items: center;

    :deep(.nut-avatar) {
      flex: 0 0 auto;
      overflow: hidden;
      border-radius: 50%;
      background: var(--card-color);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  .name {
    min-width: 0;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    font-size: 18px;
    font-weight: bold;
  }

  .title {
    margin: 0;
    overflow: hidden;
    color: var(--primary-text-color);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .des {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    color: var(--comment-text-color);
    font-size: 12px;
    font-weight: normal;
    line-height: 1.45;
  }
}

.config-card {
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface-card);
  color: var(--second-text-color);
  overflow: hidden;
}

.nut-icon {
  color: var(--lowest-text-color);
}

.right-icon {
  color: var(--comment-text-color);
}

.template-list {
  display: flex;
  flex-direction: column;
}

.template-item {
  min-height: 60px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--divider-color);

  &:last-child {
    border-bottom: 0;
  }
}

.template-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-title,
.template-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--primary-text-color);
}

.template-meta {
  font-size: 12px;
  color: var(--comment-text-color);
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.template-import-panel {
  outline: none;

  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--second-text-color);

  // 仅编辑器参与高度收缩，表单与按钮保持自身高度
  > *:not(.template-content-editor) {
    flex: 0 0 auto;
  }

  h2 {
    margin: 0 0 4px;
    font-size: 17px;
    color: var(--primary-text-color);
  }
}

.template-source-url {
  margin: 0;
  font-size: 12px;
  color: var(--comment-text-color);
  word-break: break-all;
}

.template-source-error {
  margin: 0;
  font-size: 12px;
  color: var(--danger-color, #ff4444);
}

.template-sync-summary {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  margin: 10px 20px 0;
  padding: 4px 8px;
  border-radius: var(--ui-radius-sm);
  background: var(--ui-surface-page);
  font-size: 12px;
  color: var(--ui-text-tertiary);
}

.template-sync-summary.is-error {
  background: color-mix(in srgb, var(--ui-danger) 8%, transparent);
  color: var(--ui-danger);
}

.template-meta.is-error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ui-text-secondary);
}

.template-meta.is-error::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ui-danger);
}

.template-action-menu {
  display: flex;
  flex-direction: column;
}

.template-action-menu__title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 13px;
  color: var(--comment-text-color);
}

.template-action-menu__item {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-top: 1px solid var(--border-color, #eee);
  background: transparent;
  color: var(--primary-text-color);
  font-size: 15px;

  &.is-cancel {
    margin-top: 8px;
    border-top: none;
    border-radius: 8px;
    background: var(--card-color);
    color: var(--second-text-color);
  }
}

.template-form {
  background: var(--card-color);
  border-radius: var(--item-card-radios);
  overflow: hidden;
  padding: 0 16px;
}

.template-form__row {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;

  & + & {
    border-top: 1px solid var(--divider-color);
  }

  &.is-clickable {
    cursor: pointer;
  }
}

.template-form__label {
  flex: 0 0 auto;
  color: var(--second-text-color);
}

.template-target-options {
  margin-left: auto;
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: var(--background-color);
}

.template-target-option {
  min-height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--second-text-color);
  font: inherit;
  cursor: pointer;

  &.current {
    background: var(--primary-color);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
}

.template-form__value {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-text-color);

  &.is-muted {
    color: var(--comment-text-color);
  }
}

.template-content-editor {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--divider-color);
  border-radius: var(--item-card-radios);
  background: var(--background-color);
  overflow: hidden;

  // 编辑器填满弹层剩余高度并内部滚动，避免内容溢出到弹层外
  :deep(.cmviewRef) {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.cmviewRef > div:nth-of-type(2)) {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.cm-editor) {
    height: 100%;
  }

  :deep(.cm-scroller) {
    overflow: auto;
  }
}

.title-wrapper {
  min-height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--ui-border-subtle);
  cursor: pointer;

  h1 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--primary-text-color);
  }
}

.storage-card .title-wrapper {
  cursor: default;
}

.storage-actions,
.config-btn-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    display: none;
  }
}

.card-desc {
  margin: 0;
  padding: 12px 20px 16px;
  color: var(--comment-text-color);
  font-size: 13px;
  line-height: 1.6;
}

.config-input-wrapper {
  padding: 0 20px 12px;
  display: flex;
  flex-direction: column;
}

@media screen and (max-width: 430px) {
  .profile-block {
    .info {
      align-items: flex-start;
    }
  }

  .title-wrapper {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }

  .storage-actions {
    flex-wrap: wrap;
  }

  .template-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .template-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
