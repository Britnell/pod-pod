import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className=" px-3 pt-4">
      <h1 className="heading text-2xl">HOME</h1>
    </div>
  );
}
