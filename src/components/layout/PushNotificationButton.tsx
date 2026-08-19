import { BellSlash, BellRinging } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function PushNotificationButton() {
  const { t } = useTranslation();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  if (!supported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label={t("alerts.pushUnsupported")}
        title={t("alerts.pushUnsupported")}
      >
        <BellSlash className="h-5 w-5" aria-hidden />
      </Button>
    );
  }

  const enabled = permission === "granted";

  async function request() {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    // The actual POST /push-subscriptions call will run once backend and VAPID key are wired.
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={request}
      aria-label={enabled ? t("alerts.disablePush") : t("alerts.enablePush")}
      title={enabled ? t("alerts.disablePush") : t("alerts.enablePush")}
    >
      {enabled ? (
        <BellRinging className="h-5 w-5 text-primary" aria-hidden />
      ) : (
        <BellSlash className="h-5 w-5" aria-hidden />
      )}
    </Button>
  );
}
