import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useStore, StoreContext } from "../useStore";
import { useAutoSync } from "../autosync";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const store = useStore();
  const { podcaststate, settingstate } = store;
  const [podcasts] = podcaststate;

  const { syncing } = useAutoSync(settingstate);

  return (
    <StoreContext.Provider value={store}>
      <header className="col-span-2 bg-slate-400 py-1 ">
        <div className="px-6 max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/" className="heading">
            Pod-pod
          </Link>
          <Link to="/" className="ml-auto">
            home
          </Link>
          <Link to="/sync" className="">
            sync
          </Link>
          <Link to="/settings" className="mr-auto">
            settings
          </Link>
          {syncing && (
            <span className="ml-auto bg-orange-400 px-1 rounded font-medium">
              syncing…
            </span>
          )}
        </div>
      </header>
      <div className=" max-w-5xl mx-auto grid grid-cols-[auto_1fr]">
        <aside className="w-[250px] min-h-[calc(100vh-2rem)] border-r border-slate-300 space-y-2 px-2">
          <Link
            to="/add"
            className=" bg-slate-100 hover:bg-slate-200 px-1 rounded mt-2 h-8 flex items-center gap-2"
          >
            <span className="x px-2">+</span>
            Add Podcast
          </Link>
          {podcasts.map((podcast) => (
            <Link
              key={podcast.collectionId}
              to="/podcast/$id"
              params={{ id: String(podcast.collectionId) }}
              className="flex w-full items-center gap-2 bg-slate-100 hover:bg-slate-200 pr-1 rounded"
            >
              <img
                className=" w-8 rounded-l"
                src={podcast.artworkUrl60}
                alt={podcast.collectionName}
              />
              <span>{podcast.collectionName}</span>
            </Link>
          ))}
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </StoreContext.Provider>
  );
}
