import { atom, useAtom } from "jotai";

export interface DownloadingEpisode {
  guid: string;
  title: string | null | undefined;
  img: string | null | undefined;
}

export const downloadingAtom = atom<DownloadingEpisode[]>([]);

export const useDownloader = () => {
  const [downloading, setDownloading] = useAtom(downloadingAtom);
  return { downloading, setDownloading };
};
