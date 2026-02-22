import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export interface Episode {
  title: string | null | undefined;
  guid: string | null | undefined;
  date: string | null | undefined;
  duration: string | null | undefined;
  description: string | null | undefined;
  audioUrl: string | null | undefined;
  img: string | null | undefined;
  episode: string | null | undefined;
  season: string | null | undefined;
}

interface CachedEpisodes {
  episodes: Episode[];
  fetchedAt: number;
}

interface Podcast {
  collectionName: string;
  feedUrl?: string;
}

async function fetchEpisodes(feedUrl: string): Promise<Episode[]> {
  const res = await tauriFetch(feedUrl);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("item")).map((item) => {
    const date = item.querySelector("pubDate")?.textContent;
    const guid = item.querySelector("guid")?.textContent;
    const title = item.querySelector("title")?.textContent;
    const audioUrl =
      item.querySelector("enclosure")?.getAttribute("url") ?? undefined;
    const duration =
      item.getElementsByTagName("itunes:duration")[0]?.textContent;
    const description =
      item.getElementsByTagName("itunes:summary")[0]?.textContent;
    const episode = item.getElementsByTagName("itunes:episode")[0]?.textContent;
    const season = item.getElementsByTagName("itunes:season")[0]?.textContent;
    const img = item
      .getElementsByTagName("itunes:image")[0]
      ?.getAttribute("href");
    return {
      title,
      guid,
      date,
      duration,
      description,
      audioUrl,
      img,
      episode,
      season,
    };
  });
}

async function loadEpisodes(feedUrl: string, key: string): Promise<Episode[]> {
  const store = await load("episodes.json");
  const raw = await store.get<string>(key);
  if (raw) {
    const cached: CachedEpisodes = JSON.parse(raw);
    return cached.episodes;
  }
  return doFetchAndCache(feedUrl, key);
}

async function doFetchAndCache(
  feedUrl: string,
  key: string,
): Promise<Episode[]> {
  const fetched = await fetchEpisodes(feedUrl);
  const store = await load("episodes.json");
  const cached: CachedEpisodes = { episodes: fetched, fetchedAt: Date.now() };
  await store.set(key, JSON.stringify(cached));
  await store.save();
  return fetched;
}

export function usePodcastEpisodes(podcast: Podcast | undefined) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    load();

    async function load() {
      if (!podcast?.feedUrl) return;
      const feedUrl = podcast.feedUrl;
      const key = `episodes:${podcast.collectionName}`;

      setIsLoading(true);
      try {
        const eps = await loadEpisodes(feedUrl, key);
        setEpisodes(eps);
      } finally {
        setIsLoading(false);
      }
    }
  }, [podcast?.collectionName]);

  async function refresh() {
    if (!podcast?.feedUrl) return;
    const feedUrl = podcast.feedUrl;
    const key = `episodes:${podcast.collectionName}`;
    setIsLoading(true);
    try {
      setEpisodes(await doFetchAndCache(feedUrl, key));
    } finally {
      setIsLoading(false);
    }
  }

  return { episodes, isLoading, refresh };
}
