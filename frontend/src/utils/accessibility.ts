const FOCUSABLE_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "a[href]",
  "[role='button']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
};

const isDisabled = (element: HTMLElement) => {
  return element.hasAttribute("disabled")
    || element.classList.contains("nut-button--disabled")
    || element.classList.contains("nut-button--loading");
};

const enhanceButtons = () => {
  document.querySelectorAll<HTMLElement>(".nut-button").forEach((element) => {
    if (element.tagName === "BUTTON") return;
    element.setAttribute("role", "button");
    const disabled = isDisabled(element);
    if (!disabled && !element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "0");
    }
    if (disabled) {
      if (element.getAttribute("aria-disabled") !== "true") element.setAttribute("aria-disabled", "true");
      element.removeAttribute("tabindex");
    } else if (element.hasAttribute("aria-disabled")) {
      element.removeAttribute("aria-disabled");
    }
  });
};

const visiblePopups = () => {
  return Array.from(document.querySelectorAll<HTMLElement>(".nut-popup"))
    .filter(isVisible);
};

const topPopup = () => visiblePopups().at(-1);

const focusableElements = (container: HTMLElement) => {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => isVisible(element) && !isDisabled(element));
};

const closePopup = (popup: HTMLElement) => {
  const closeIcon = popup.querySelector<HTMLElement>(".nut-popup__close-icon");
  if (closeIcon) {
    closeIcon.click();
    return true;
  }
  const cancel = popup.querySelector<HTMLElement>(".nut-dialog__footer-cancel, .nut-picker__left");
  if (cancel) {
    cancel.click();
    return true;
  }
  return false;
};

export const installAccessibilityEnhancements = () => {
  let activePopup: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  let refreshQueued = false;

  const syncPopupFocus = () => {
    const popup = topPopup();
    if (popup === activePopup) return;
    if (activePopup && previousFocus?.isConnected) previousFocus.focus();
    activePopup = popup;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (popup) {
      requestAnimationFrame(() => {
        const first = focusableElements(popup)[0];
        first?.focus();
      });
    }
  };

  const refresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      enhanceButtons();
      syncPopupFocus();
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : undefined;
    const button = target?.closest<HTMLElement>(".nut-button[role='button']");
    if (button && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      if (!isDisabled(button)) button.click();
      return;
    }

    const popup = topPopup();
    if (!popup) return;

    if (event.key === "Escape") {
      if (closePopup(popup)) {
        event.preventDefault();
      }
      return;
    }

    if (event.key !== "Tab") return;
    const focusables = focusableElements(popup);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables.at(-1) as HTMLElement;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !popup.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  };

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "disabled", "aria-disabled"],
  });
  document.addEventListener("keydown", onKeydown);
  refresh();

  return () => {
    observer.disconnect();
    document.removeEventListener("keydown", onKeydown);
  };
};
