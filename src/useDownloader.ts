import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { writeFile, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
import type { Episode } from "./usePodcastEpisodes";
import type { Podcast, Settings } from "./useStore";

const PARALLEL_DOWNLOADS = 2;

export interface DownloadingEpisode {
  guid: string;
  title: string | null | undefined;
  img: string | null | undefined;
  audioUrl: string;
  collectionName: string;
}

export const downloadingAtom = atom<DownloadingEpisode[]>([]);

export function episodeFilename(ep: { title?: string | null; audioUrl?: string }): string {
  const ext = ep.audioUrl?.split(".").pop()?.split("?")[0] ?? "mp3";
  const safe = ep.title?.replace(/[/\\:*?"<>|]/g, "_") ?? "episode";
  return `${safe}.${ext}`;
}

async function performDownload(ep: DownloadingEpisode): Promise<void> {
  const folder = `Podcasts/${ep.collectionName}`;
  const filename = `${folder}/${episodeFilename(ep)}`;
  const response = await tauriFetch(ep.audioUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(folder, { baseDir: BaseDirectory.Audio, recursive: true });
  await writeFile(filename, bytes, { baseDir: BaseDirectory.Audio });
}

interface UseDownloaderProps {
  settingstate?: [Settings, (s: Settings) => void];
  podcaststate?: [Podcast[], (p: Podcast[]) => void];
}

export const useDownloader = ({
  settingstate,
  podcaststate,
}: UseDownloaderProps = {}) => {
  const [downloading, setDownloading] = useAtom(downloadingAtom);
  const activeRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const settings = settingstate?.[0];
  const podcasts = podcaststate?.[0];

  useEffect(() => {
    const slotsAvailable = PARALLEL_DOWNLOADS - activeRef.current.size;
    if (slotsAvailable <= 0) return;

    const toStart = downloading
      .filter((ep) => !activeRef.current.has(ep.guid))
      .slice(0, slotsAvailable);

    toStart.forEach((ep) => {
      activeRef.current.add(ep.guid);
      performDownload(ep).finally(() => {
        activeRef.current.delete(ep.guid);
        setDownloading((prev) => prev.filter((d) => d.guid !== ep.guid));
        queryClient.invalidateQueries({ queryKey: ["savedFiles"] });
      });
    });
  }, [downloading]);

  useEffect(() => {
    if (!settings?.autoDownload) return;
    const count = settings?.autoDownloadCount;
    if (!count) return;

    podcasts?.forEach((pod) => {
      const episodes = queryClient.getQueryData<Episode[]>([
        "episodes",
        pod.collectionName,
      ]);
      const list = episodes?.slice(0, count);
      console.log(pod, list);
      // use episodes...
    });
  }, [settings, podcasts]);

  return { downloading, setDownloading };
};
