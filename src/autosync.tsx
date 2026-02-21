import React from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import { watchImmediate } from "@tauri-apps/plugin-fs";
import { Settings } from "./useStore";

export const useAutoSync = (
  settingstate: [Settings, (s: Settings) => void],
) => {
  const [settings] = settingstate;

  const [podConnected, setpodConnected] = React.useState(false);

  React.useEffect(() => {
    // detect pod connected
    if (!settings.autoSync) return;
    if (!settings.devicePath) return;

    const devicePath = settings.devicePath;
    let unwatchFn: (() => void) | null = null;
    let cancelled = false;

    async function checkConnected() {
      try {
        const x = await readDir(devicePath);
        console.log({ x });
        if (!cancelled) setpodConnected(true);
      } catch {
        if (!cancelled) setpodConnected(false);
      }
    }

    async function startWatching() {
      await checkConnected();
      if (cancelled) return;
      try {
        unwatchFn = await watchImmediate("/Volumes", () => {
          checkConnected();
        });
        // If cleanup already ran before watchImmediate resolved, unwatch immediately
        if (cancelled) {
          unwatchFn();
          unwatchFn = null;
        }
      } catch (e) {
        console.error("Failed to watch /Volumes:", e);
      }
    }

    startWatching();

    return () => {
      cancelled = true;
      unwatchFn?.();
    };
  }, [settings.autoSync, settings.devicePath]);

  console.log({ podConnected });

  React.useEffect(() => {
    if (!settings.autoSync) return;
    if (!settings.devicePath) return;
    if (!podConnected) return;

    console.log("sync to ", settings.devicePath);
    //
  }, [podConnected, settings.autoSync, settings.devicePath]);
};
