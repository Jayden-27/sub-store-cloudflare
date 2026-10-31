import i18n from "@/locales";

const timeoutPattern = /\b(timeout|timed out|etimedout)\b|超时/i;
const networkPattern =
  /\b(network ?error|failed to fetch|load failed|fetch failed|err_network|econnrefused|enotfound|connection reset)\b/i;

const toRawText = (error: unknown) => {
  if (typeof error === "string") return error.trim();
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? (error as { message?: unknown }).message
        : "";
  return typeof message === "string" ? message.trim() : "";
};

export const friendlyError = (error: unknown, fallback?: string) => {
  const raw = toRawText(error);
  if (!raw) return fallback || i18n.global.t("globalNotify.request.failed");
  if (timeoutPattern.test(raw)) return i18n.global.t("globalNotify.request.timeout");
  if (networkPattern.test(raw)) return i18n.global.t("globalNotify.request.networkRetry");
  return raw;
};
