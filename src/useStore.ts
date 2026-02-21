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

interface StoreState {
  podcaststate: [Podcast[], (p: Podcast[]) => void];
}

export const StoreContext = createContext<StoreState | null>(null);

export function useStoreContext(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreContext.Provider");
  return ctx;
}

export function useStore(): StoreState {
  const storeRef = useRef<Store | null>(null);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await load("store.json");
        const saved = await s.get<Podcast[]>("podcasts");
        storeRef.current = s;
        if (saved) setPodcasts(saved);
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

  return { podcaststate: [podcasts, setPodcasts] };
}
