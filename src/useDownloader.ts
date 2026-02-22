import { atom, useAtom } from "jotai";
import { useEffect } from "react";
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

  const settings = settingstate?.[0];
  const podcasts = podcaststate?.[0];

  useEffect(() => {
    if (!settings?.autoDownload) return;
    const count = settings?.autoDownloadCount;
    if (!count) return;

    podcasts?.forEach((_pod) => {
      // console.log(pod);
    });
  }, [settings, podcasts]);

  return { downloading, setDownloading };
};
