import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useStore } from "../useStore";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { podcaststate } = useStore();
  const [podcasts] = podcaststate;

  return (
    <div className="px-10 mx-auto grid grid-cols-[auto_1fr]">
      <header className="col-span-2 bg-slate-400">
        <Link to="/">i-Pod-casts</Link>
      </header>
      <aside className="w-[200px] border-r border-slate-600">
        <Link to="/add">+ Add Podcast</Link>
        {podcasts.map((podcast) => (
          <Link
            key={podcast.collectionId}
            to="/podcast/$id"
            params={{ id: String(podcast.collectionId) }}
            className="flex w-full"
          >
            <img src={podcast.artworkUrl60} alt={podcast.collectionName} />
            <span>{podcast.collectionName}</span>
          </Link>
        ))}
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
