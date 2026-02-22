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
import { useDownloader } from "../useDownloader";
import { type DownloadingEpisode } from "../atoms";
import { usePodcastEpisodes, type Episode } from "../usePodcastEpisodes";

export const Route = createFileRoute("/podcast/$id")({
  component: PodcastDetail,
});

const PAGE_SIZE = 10;

function PodcastDetail() {
  const { id } = Route.useParams();
  const { podcaststate } = useStoreContext();
  const [results, setResults] = React.useState(PAGE_SIZE);
  const { downloading, setDownloading } = useDownloader();

  const [podcasts] = podcaststate;
  const podcast = podcasts.find((p) => p.collectionId === Number(id));

  const { episodes, isLoading } = usePodcastEpisodes(podcast);

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
    const entry: DownloadingEpisode = { guid: ep.guid!, title: ep.title, img: ep.img };
    setDownloading((prev) => [...prev, entry]);
    downloadEpisode(podcast, ep).finally(() => {
      setDownloading((prev) => prev.filter((e) => e.guid !== entry.guid));
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
        {episodes.slice(0, results).map((ep) => {
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
          const isDownloading = downloading.some((e) => e.guid === ep.guid!);

          const img = ep.img || podcast.artworkUrl100;
          const date = ep.date?.split(" ").slice(0, 4).join(" ");

          return (
            <li
              key={ep.guid}
              className="my-4 w-full relative p-2 border border-slate-200 grid grid-cols-[auto_1fr_auto] gap-2 rounded-sm "
            >
              <img
                className=" w-12 rounded-sm"
                src={img}
                alt="podcast cover img"
              />
              <div className="x">
                <div className="flex justify-between">
                  <h2 className="text-lg font-medium">{ep.title}</h2>
                  <div className="x">
                    {downloaded ? (
                      <span className="text-xs px-1 bg-orange-200">saved</span>
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
                </div>
                <p className="text-sm  flex gap-3 ">
                  <span className="max-w-[60vw]  text-ellipsis text-nowrap  overflow-hidden inline-flex  gap-2 bg-slate-100 px-1 rounded">
                    {!!h && `${h} hr`}
                    {!!m && `${m} min`}
                  </span>
                  {ep.season && (
                    <span className="text-sm">season {ep.season}</span>
                  )}
                  {ep.episode && (
                    <span className="text-sm">episode {ep.episode}</span>
                  )}
                  <span className="ml-auto text-slate-400">{date}</span>
                </p>

                <p
                  className="x text-sm line-clamp-2 opacity-75"
                  dangerouslySetInnerHTML={{ __html: ep.description }}
                ></p>
              </div>
            </li>
          );
        })}
      </ul>
      {results < episodes.length && (
        <button
          onClick={() => setResults((c) => c + PAGE_SIZE)}
          className="w-full py-2 text-sm text-slate-500 border border-slate-200 rounded-sm"
        >
          Load more
        </button>
      )}
    </div>
  );
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
