import React from "react";
import { readDir, watchImmediate } from "@tauri-apps/plugin-fs";
import { audioDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { Settings } from "./useStore";
export const useAutoSync = (
  settingstate: [Settings, (s: Settings) => void],
) => {
  const [settings] = settingstate;

  const [podConnected, setpodConnected] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  // Watch /Volumes to detect iPod connect/disconnect
  React.useEffect(() => {
    if (!settings.autoSync) return;
    if (!settings.devicePath) return;

    const devicePath = settings.devicePath;
    let unwatchFn: (() => void) | null = null;
    let cancelled = false;

    async function checkConnected() {
      try {
        await readDir(devicePath);
        if (!cancelled) setpodConnected(true);
      } catch {
        if (!cancelled) setpodConnected(false);
      }
    }

    async function start() {
      await checkConnected();
      if (cancelled) return;
      try {
        unwatchFn = await watchImmediate("/Volumes", () => {
          if (!cancelled) checkConnected();
        });
        if (cancelled) unwatchFn();
      } catch (e) {
        console.error("Failed to watch /Volumes:", e);
      }
    }

    start();

    return () => {
      cancelled = true;
      unwatchFn?.();
    };
  }, [settings.autoSync, settings.devicePath]);

  // When pod is connected, sync immediately then watch podcast folder for new downloads
  React.useEffect(() => {
    if (!settings.autoSync) return;
    if (!settings.devicePath) return;
    if (!podConnected) return;

    const devicePath = settings.devicePath;
    let unwatchFn: (() => void) | null = null;
    let cancelled = false;

    async function runSync() {
      const source = `${await audioDir()}/Podcasts`;
      setSyncing(true);
      try {
        await invoke("sync_to_device", {
          source,
          destination: devicePath,
          delete: false,
        });
      } catch (e) {
        console.error("Auto sync failed:", e);
      } finally {
        setSyncing(false);
      }
    }

    start();

    async function start() {
      if (cancelled) return;
      await runSync();
      const podcastDir = `${await audioDir()}/Podcasts`;
      try {
        unwatchFn = await watchImmediate(
          podcastDir,
          () => {
            if (!cancelled) runSync();
          },
          { recursive: true },
        );
        if (cancelled) unwatchFn();
      } catch (e) {
        console.error("Failed to watch podcast folder:", e);
      }
    }

    return () => {
      cancelled = true;
      unwatchFn?.();
    };
  }, [podConnected, settings.autoSync, settings.devicePath]);

  return { syncing };
};
