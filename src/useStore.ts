import { useState, useEffect, useRef, createContext, useContext } from "react";
import { load, Store } from "@tauri-apps/plugin-store";

export interface Podcast {
  collectionId: number;
  collectionName: string;
  artistName: string;
  feedUrl?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
}

export interface Settings {
  devicePath: string | null;
  autoSync: boolean;
  autoDownload: boolean;
  autoDownloadCount: number;
}

const defaultSettings: Settings = {
  devicePath: null,
  autoSync: false,
  autoDownload: false,
  autoDownloadCount: 3,
};

interface StoreState {
  podcaststate: [Podcast[], (p: Podcast[]) => void];
  settingstate: [Settings, (s: Settings) => void];
}

export const StoreContext = createContext<StoreState | null>(null);

export function useStoreContext(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx)
    throw new Error(
      "useStoreContext must be used within StoreContext.Provider",
    );
  return ctx;
}


export function useStore(): StoreState {
  const storeRef = useRef<Store | null>(null);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await load("store.json");
        const savedPodcasts = await s.get<Podcast[]>("podcasts");
        const savedSettings = await s.get<Settings>("settings");
        storeRef.current = s;
        if (savedPodcasts) setPodcasts(savedPodcasts);
        if (savedSettings) setSettings(savedSettings);
        loadedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize store:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!storeRef.current || !loadedRef.current) return;
    storeRef.current.set("podcasts", podcasts);
    storeRef.current.save();
  }, [podcasts]);

  useEffect(() => {
    if (!storeRef.current || !loadedRef.current) return;
    storeRef.current.set("settings", settings);
    storeRef.current.save();
  }, [settings]);

  return {
    podcaststate: [podcasts, setPodcasts],
    settingstate: [settings, setSettings],
  };
}
