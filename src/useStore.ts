import { useState, useEffect, useRef } from "react";
import { load, Store } from "@tauri-apps/plugin-store";

interface Podcast {
	collectionId: number;
	collectionName: string;
	artistName: string;
	feedUrl?: string;
	artworkUrl60?: string;
	artworkUrl100?: string;
	artworkUrl600?: string;
}

interface StoreState {
	podcasts: Podcast[];
	setPodcasts: (podcasts: Podcast[]) => void;
}

export function useStore(): StoreState {
	const storeRef = useRef<Store | null>(null);
	const [podcasts, setPodcasts] = useState<Podcast[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const s = await load("store.json");
				const saved = await s.get<Podcast[]>("podcasts");
				if (saved) {
					setPodcasts(saved);
				}
				storeRef.current = s;
			} catch (error) {
				console.error("Failed to initialize store:", error);
			}
		})();
	}, []);

	useEffect(() => {
		if (!storeRef.current) return;
		storeRef.current.set("podcasts", podcasts);
		storeRef.current.save();
	}, [podcasts]);

	return { podcaststate: [podcasts, setPodcasts] };
}
