import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "../useStore";

export const Route = createFileRoute("/add")({
	component: AddPodcast,
});

interface PodcastResult {
	wrapperType: string;
	kind: string;
	collectionId: number;
	trackId: number;
	artistName: string;
	collectionName: string;
	trackName: string;
	collectionViewUrl: string;
	trackViewUrl: string;
	feedUrl?: string;
	artworkUrl30?: string;
	artworkUrl60?: string;
	artworkUrl100?: string;
	artworkUrl600?: string;
	primaryGenreName?: string;
	trackCount?: number;
	releaseDate?: string;
}

interface iTunesSearchResponse {
	resultCount: number;
	results: PodcastResult[];
}

function AddPodcast() {
	const navigate = useNavigate();
	const { podcaststate } = useStore();
	const [podcasts, setPodcasts] = podcaststate;
	const [searchTerm, setSearchTerm] = useState("");

	const { data: searchResults, isLoading, error } = useQuery<iTunesSearchResponse | null>({
		queryKey: ["podcastSearch", searchTerm],
		queryFn: async () => {
			if (!searchTerm.trim()) return null;
			const response = await fetch(
				`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=podcast&limit=25`,
			)
			const json: iTunesSearchResponse = await response.json();
			return json;
		},
		enabled: !!searchTerm.trim(),
	})

	const handleSubmit = (e: any) => {
		e.preventDefault();
	}

	return (
		<div>
			<button onClick={() => navigate({ to: "/" })}>← Back</button>
			<h1>Podcast Search</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					placeholder="Search for podcasts..."
					value={searchTerm}
					onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
				/>
				<button type="submit" disabled={isLoading}>
					{isLoading ? "Searching..." : "Search"}
				</button>
			</form>

			{error && <p style={{ color: "red" }}>Error: {error.message}</p>}

			{searchResults && (
				<ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
					{searchResults.results.map((podcast) => (
						<li
							key={podcast.trackId}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.75rem",
								marginBottom: "0.75rem",
							}}
						>
							{podcast.artworkUrl60 && (
								<img
									src={podcast.artworkUrl60}
									alt={podcast.collectionName}
									width={60}
									height={60}
									style={{ borderRadius: "8px", flexShrink: 0 }}
								/>
							)}
							<div style={{ flex: 1 }}>
								<a href={podcast.collectionViewUrl} target="_blank" rel="noreferrer">
									{podcast.collectionName}
								</a>
								{podcast.artistName && (
									<div style={{ fontSize: "0.85em", opacity: 0.7 }}>
										{podcast.artistName}
									</div>
								)}
							</div>
							{podcasts.some((p) => p.collectionId === podcast.collectionId) ? (
								<button onClick={() => setPodcasts((prev) => prev.filter((p) => p.collectionId !== podcast.collectionId))}>
									Remove
								</button>
							) : (
								<button onClick={() => setPodcasts((prev) => [...prev, podcast])}>
									Add
								</button>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
