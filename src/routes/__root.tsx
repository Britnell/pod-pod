import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { useStore, StoreContext } from "../useStore";
import { useAutoSync } from "../autosync";
import { useDownloader } from "../useDownloader";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const store = useStore();
  const { podcaststate, settingstate } = store;
  const [podcasts] = podcaststate;

  const { syncing } = useAutoSync(settingstate);
  const { downloading } = useDownloader();
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <StoreContext.Provider value={store}>
      <header className="  ">
        <nav className="px-6 bg-brown-400  py-1 rounded max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/" className="heading">
            Pod-pod
          </Link>
          <Link
            to="/"
            className="font-bold underline-offset-2 hover:underline rounded-sm px-1 ml-auto"
          >
            Home
          </Link>
          <Link
            to="/sync"
            className="font-bold underline-offset-2 hover:underline rounded-sm px-1 "
          >
            Sync
          </Link>
          <Link
            to="/download"
            className="font-bold underline-offset-2 hover:underline rounded-sm px-1 mr-auto"
          >
            Download
          </Link>
          {syncing && (
            <span className="ml-auto bg-orange-400 px-1 rounded font-medium">
              syncing…
            </span>
          )}
          <button
            className={` border rounded w-8 pb-0.5 text-sm ${!!downloading?.length ? "" : " xinvisible"}`}
            onClick={() => dialogRef.current?.showModal()}
          >
            &darr;
          </button>
        </nav>
      </header>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent backdrop:bg-black/20"
        onClick={(e) =>
          e.target === e.currentTarget && dialogRef.current?.close()
        }
      >
        <div className="header-menu absolute top-14 right-[calc(max((100vw-1024px)/2,0rem))] bg-white rounded-lg shadow-lg min-w-[200px] p-4 ">
          <h2>Downloading</h2>
          <ul>
            {downloading?.map((ep) => (
              <li key={ep.guid} className=" flex gap-2">
                <img src={ep.img ?? ""} alt="" width={32} height={32} />
                <span className="x">{ep.title ?? ep.guid}</span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>

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
          <Outlet test={123} />
        </main>
      </div>
    </StoreContext.Provider>
  );
}
