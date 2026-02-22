import { atom } from "jotai";

export interface DownloadingEpisode {
  guid: string;
  title: string | null | undefined;
  img: string | null | undefined;
}

export const downloadingAtom = atom<DownloadingEpisode[]>([]);
