"use client";

import { useEffect } from "react";

export default function WakeUpBackend() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");

    fetch(`${baseUrl}/api/public/ping`, {
      method: "GET",
      cache: "no-store",
    })
      .then(() => console.log("Wake up backend signal is sent"))
      .catch(() => {});
  }, []);

  return null;
}
