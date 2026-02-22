import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  writeFile,
  BaseDirectory,
  mkdir,
  readDir,
} from "@tauri-apps/plugin-fs";
import { useStoreContext } from "../useStore";

export const Route = createFileRoute("/podcast/$id")({
  component: PodcastDetail,
});

function PodcastDetail() {
  const { id } = Route.useParams();
  const { podcaststate } = useStoreContext();
  const [podcasts] = podcaststate;
  const podcast = podcasts.find((p) => p.collectionId === Number(id));
  const [downloading, setDownloading] = React.useState<string[]>([]);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["episodes", id],
    queryFn: () => fetchEpisodes(podcast?.feedUrl!),
    enabled: !!podcast,
  });

  const { data: savedFiles, refetch: refetchSavedFiles } = useQuery({
    queryKey: ["savedFiles", podcast?.collectionName],
    queryFn: () => {
      const folder = podcast?.collectionName ?? "";

      return readDir(`Podcasts/${folder}`, {
        baseDir: BaseDirectory.Audio,
      })
        .then((res) => {
          return res.map((f) => f.name);
        })
        .catch(() => [] as string[]);
    },
    enabled: !!podcast?.collectionName,
  });

  const download = (
    podcast: { collectionName?: string | null },
    ep: Episode,
  ) => {
    const guid = ep.guid!;
    setDownloading((prev) => [...prev, guid]);
    downloadEpisode(podcast, ep).finally(() => {
      setDownloading((prev) => prev.filter((id) => id !== guid));
      refetchSavedFiles();
    });
  };

  if (!podcast) {
    return <div>Podcast not found</div>;
  }
  if (isLoading) {
    return <p>Loading...</p>;
  }
  // console.log(podcast);

  return (
    <div className="p-4">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <img
          src={podcast.artworkUrl100}
          alt={podcast.collectionName}
          className="w-20 float-left"
        />
        <div className="x">
          <h1 className="text-3xl font-bold">{podcast.collectionName}</h1>
          <p className=" text-slate-500">{podcast.trackCount} episodes</p>
        </div>
      </div>
      <ul>
        {episodes.slice(0, 10).map((ep) => {
          const [a, b, c] =
            ep.duration?.split(":").map((str) => parseInt(str)) ?? [];
          let h = 0,
            m = 0;
          if (!b && !c) {
            h = Math.floor(a / 3600);
            m = Math.floor(a / 60) % 60;
          } else {
            h = c ? a : 0;
            m = c ? b : a;
          }

          const downloaded = savedFiles?.includes(episodeFilename(ep));
          const isDownloading = downloading.includes(ep.guid!);

          const date = ep.pubDate?.split(" ").slice(0, 4).join(" ");

          return (
            <li
              key={ep.guid}
              className="my-4 w-full relative p-2 border border-slate-200 grid grid-cols-[auto_1fr_auto] gap-2 "
            >
              <img alt="..." src={ep.img} className=" w-14" />
              <div className="x">
                <h2 className="text-lg font-medium">{ep.title}</h2>
                <p className="text-sm text-slate-500"> {date}</p>
                <p className="max-w-[60vw]  text-ellipsis text-nowrap  overflow-hidden inline-flex  gap-2 bg-slate-100 px-1 rounded">
                  {!!h && <span className="">{h} hr</span>}
                  {!!m && <span className="">{m} min</span>}
                </p>
              </div>
              <div className="x">
                {downloaded ? (
                  <button className="text-xs px-1 bg-orange-200">saved</button>
                ) : isDownloading ? (
                  <span className="text-xs px-1 text-slate-400">
                    downloading…
                  </span>
                ) : (
                  <button
                    onClick={() => download(podcast, ep)}
                    className="text-xs px-1 bg-blue-200"
                  >
                    Download
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface Episode {
  title: string | null | undefined;
  guid: string | null | undefined;
  pubDate: string | null | undefined;
  duration: string | null | undefined;
  description: string | null | undefined;
  audioUrl: string | null | undefined;
}

function episodeFilename(episode: Episode): string {
  const ext = episode.audioUrl?.split(".").pop()?.split("?")[0] ?? "mp3";
  const safe = episode.title?.replace(/[/\\:*?"<>|]/g, "_") ?? "episode";
  return `${safe}.${ext}`;
}

async function downloadEpisode(
  podcast: { collectionName?: string | null },
  episode: Episode,
) {
  const { audioUrl } = episode;
  if (!audioUrl) return;
  const folder = `Podcasts/${podcast.collectionName!}`;
  const filename = `${folder}/${episodeFilename(episode)}`;
  const response = await tauriFetch(audioUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(folder, { baseDir: BaseDirectory.Audio, recursive: true });
  await writeFile(filename, bytes, { baseDir: BaseDirectory.Audio });
}

async function fetchEpisodes(feedUrl: string): Promise<Episode[]> {
  const res = await tauriFetch(feedUrl).catch((err) => {
    return { error: err };
  });
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("item")).map((item) => {
    // parse
    const pubDate = item.querySelector("pubDate")?.textContent;
    const guid = item.querySelector("guid")?.textContent;
    const title = item.querySelector("title")?.textContent;
    const audioUrl =
      item.querySelector("enclosure")?.getAttribute("url") ?? undefined;
    const duration =
      item.getElementsByTagName("itunes:duration")[0]?.textContent;
    const description =
      item.getElementsByTagName("itunes:summary")[0]?.textContent;

    // const img = item.getElementsByTagName("media:thumbnail")[0].getAttribute("url");
    const img = item
      .getElementsByTagName("itunes:image")[0]
      .getAttribute("href");

    return { title, guid, pubDate, duration, description, audioUrl, img };
  });
}
