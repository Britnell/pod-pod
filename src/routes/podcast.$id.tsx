import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../useStore";

export const Route = createFileRoute("/podcast/$id")({
  component: PodcastDetail,
  loader: async ({ params }) => {
    console.log(params);
    return [];
  },
});

function PodcastDetail() {
  const { id } = Route.useParams();
  const { podcaststate } = useStore();
  const [podcasts] = podcaststate;

  const podcast = podcasts.find((p) => p.collectionId === Number(id));

  if (!podcast) {
    return <div>Podcast not found</div>;
  }

  return (
    <div>
      <img
        src={podcast.artworkUrl600 ?? podcast.artworkUrl100}
        alt={podcast.collectionName}
        className="w-20"
      />
      <h1>{podcast.collectionName}</h1>
    </div>
  );
}
