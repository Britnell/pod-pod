import { createFileRoute } from "@tanstack/react-router";
import { useStoreContext } from "../useStore";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { settingstate } = useStoreContext();
  const [settings, setSettings] = settingstate;

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="mt-4 space-y-2">
        <h2 className="text-lg">Auto-download</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoDownload}
            onChange={(e) =>
              setSettings({ ...settings, autoDownload: e.target.checked })
            }
          />
          <span>Auto-download episodes</span>
        </label>

        {settings.autoDownload && (
          <label className="flex items-center gap-3">
            <span>Number of recent episodes to download</span>
            <input
              type="number"
              min={1}
              value={settings.autoDownloadCount ?? 2}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autoDownloadCount: Math.max(1, Number(e.target.value)),
                })
              }
              className="w-16 rounded border pl-1"
            />
          </label>
        )}
      </div>
    </div>
  );
}
