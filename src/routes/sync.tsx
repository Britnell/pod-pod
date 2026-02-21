import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { audioDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useStoreContext } from "../useStore";

export const Route = createFileRoute("/sync")({
  component: Home,
});

function Home() {
  const { settingstate } = useStoreContext();
  const [settings, setSettings] = settingstate;

  async function pickDestination() {
    const folder = await open({ directory: true, multiple: false });
    if (folder) setSettings({ ...settings, devicePath: folder });
  }
  const [syncing, setSyncing] = React.useState(false);

  async function sync() {
    console.log("start");
    if (!settings.devicePath) {
      alert("No sync destination set. Please configure it in Settings.");
      return;
    }
    const source = `${await audioDir()}/Podcasts`;
    setSyncing(true);
    try {
      await invoke("sync_to_device", {
        source,
        destination: settings.devicePath,
        delete: false,
      });
    } finally {
      setSyncing(false);
    }
    console.log("fin");
  }

  return (
    <div className="p-3">
      <h1 className=" text-2xl font-bold mb-8">Sync to ipod</h1>

      {!settings.devicePath && (
        <div>
          <p className="x">
            Select destination to sync to - connect your ipod and chose a
            destination folder
          </p>
          <button
            onClick={pickDestination}
            className="ml-10 px-1 rounded bg-slate-700 text-white"
          >
            {settings.devicePath ? "Change sync folder" : "Select sync folder"}
          </button>
        </div>
      )}
      {settings.devicePath && (
        <main className="">
          <h3 className="mt-6 font-semibold text-lg">Sync destination</h3>
          <div className="flex gap-2 mt-2">
            <button
              onClick={pickDestination}
              className=" px-1 rounded bg-slate-700 text-white"
            >
              {settings.devicePath
                ? "Change sync folder"
                : "Select sync folder"}
            </button>
            <span className="bg-slate-200 text-slate-700 px-1 rounded font-mono">
              {settings.devicePath ?? "SET PATH"}
            </span>
          </div>

          <h3 className="mt-6 font-semibold text-lg">Auto-sync</h3>
          <p>Automatically sync podcasts onto your device when connected</p>
          <div className="x p-2">
            <p className="mb-1">
              autosync is:
              <span className=" font-bold ml-2">
                {settings.autoSync ? "On" : "Off"}
              </span>
            </p>
            <button
              onClick={() =>
                setSettings({ ...settings, autoSync: !settings.autoSync })
              }
              className="px-1 rounded bg-slate-700 text-white"
            >
              {settings.autoSync ? "Disable auto sync" : "Enable auto sync"}
            </button>
          </div>
          <div className=" gap-2 mt-2"></div>
          <h3 className="mt-6 font-semibold text-lg">Manual sync</h3>
          <div className="">
            {syncing ? (
              <span>syncing...</span>
            ) : (
              <button
                onClick={sync}
                disabled={syncing}
                className=" bg-slate-300 px-1 rounded"
              >
                Sync now
              </button>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
