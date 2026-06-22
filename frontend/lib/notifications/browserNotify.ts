export async function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        icon: "/icon-cric.svg",
        badge: "/icon-cric.svg",
        ...options,
      });
      return;
    } catch {
      /* fall through */
    }
  }
  new Notification(title, { icon: "/icon-cric.svg", ...options });
}
