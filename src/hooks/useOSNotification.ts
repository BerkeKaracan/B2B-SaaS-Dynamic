"use client";

import { useState, useEffect, useCallback } from "react";

export function useOSNotification() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return false;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === "granted";
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (
        typeof window !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          icon: "/dashboard.png", 
          badge: "/dashboard.png",
          ...options,
        });
      }
    },
    [],
  );

  return { permission, requestPermission, sendNotification };
}
