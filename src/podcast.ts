export interface PodcastResult {
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
