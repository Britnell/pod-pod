import { createFileRoute } from "@tanstack/react-router";
import { useStoreContext } from "../useStore";
import { useDownloader } from "../useDownloader";

export const Route = createFileRoute("/download")({
  component: Downloads,
});

function Downloads() {
  const { settingstate } = useStoreContext();
  const [settings, setSettings] = settingstate;
  const { downloading } = useDownloader();

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold">Downloads</h1>

      <div className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Auto-download</h2>
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

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">In Progress</h2>
        {downloading?.length ? (
          <ul className="space-y-3">
            {downloading.map((ep) => (
              <li key={ep.guid} className="flex gap-3 items-center">
                <img src={ep.img ?? ""} alt="" width={48} height={48} />
                <span>{ep.title ?? ep.guid}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">No downloads in progress</p>
        )}
      </div>
    </div>
  );
}
