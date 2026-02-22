import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Episode } from "./usePodcastEpisodes";
import type { Podcast, Settings } from "./useStore";

export interface DownloadingEpisode {
  guid: string;
  title: string | null | undefined;
  img: string | null | undefined;
}

export const downloadingAtom = atom<DownloadingEpisode[]>([]);

interface UseDownloaderProps {
  settingstate?: [Settings, (s: Settings) => void];
  podcaststate?: [Podcast[], (p: Podcast[]) => void];
}

export const useDownloader = ({
  settingstate,
  podcaststate,
}: UseDownloaderProps = {}) => {
  const [downloading, setDownloading] = useAtom(downloadingAtom);
  const queryClient = useQueryClient();

  const settings = settingstate?.[0];
  const podcasts = podcaststate?.[0];

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
