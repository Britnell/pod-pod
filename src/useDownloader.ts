import { useAtom } from "jotai";
import { downloadingAtom } from "./atoms";

export const useDownloader = () => {
  const [downloading, setDownloading] = useAtom(downloadingAtom);
  return { downloading, setDownloading };
};
