"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export const mobileViewportWarningStorageKey = "ultitype:mobile-viewport-warning-dismissed";
export const mobileViewportWarningMediaQuery = "(max-width: 519px)";

export function shouldShowMobileViewportWarning({
  dismissed,
  isNarrowViewport,
}: {
  dismissed: boolean;
  isNarrowViewport: boolean;
}) {
  return isNarrowViewport && !dismissed;
}

export function MobileViewportWarning() {
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dismissOnClose, setDismissOnClose] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileViewportWarningMediaQuery);

    setIsNarrowViewport(mediaQuery.matches);
    setDismissed(window.localStorage.getItem(mobileViewportWarningStorageKey) === "true");

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsNarrowViewport(event.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  if (!shouldShowMobileViewportWarning({ dismissed, isNarrowViewport })) {
    return null;
  }

  function closeWarning() {
    if (dismissOnClose) {
      window.localStorage.setItem(mobileViewportWarningStorageKey, "true");
      setDismissed(true);
    } else {
      setIsNarrowViewport(false);
    }
  }

  return (
    <aside className="mobile-viewport-warning" role="status" aria-live="polite">
      <div className="mobile-viewport-warning-icon" aria-hidden="true">
        <AlertTriangle size={20} />
      </div>
      <div className="mobile-viewport-warning-copy">
        <strong>この画面幅はサポート対象外です</strong>
        <p>
          UltiType は 520px 以上のデスクトップ画面向けです。現在の表示ではデスクトップ向けレイアウトを維持します。
        </p>
        <label className="mobile-viewport-warning-check">
          <input
            checked={dismissOnClose}
            type="checkbox"
            onChange={(event) => setDismissOnClose(event.currentTarget.checked)}
          />
          <span>以後表示しない</span>
        </label>
      </div>
      <button
        className="mobile-viewport-warning-close"
        type="button"
        aria-label="警告を閉じる"
        onClick={closeWarning}
      >
        <X size={18} />
      </button>
    </aside>
  );
}
