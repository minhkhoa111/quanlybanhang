"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstaller() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        // A previously installed production worker can cache development chunks
        // and make the dev server repeatedly reload the page.
        void navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      }
    }
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!prompt) return null;
  return (
    <button className="pwa-install" onClick={async () => {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    }}>
      <span aria-hidden="true">↓</span>
      Cài ứng dụng Huy Apple
    </button>
  );
}
