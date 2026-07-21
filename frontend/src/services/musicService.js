import { mockSongs } from '../data/mockSongs';

export async function searchSongs(query) {
  // Replace this local filter with a real music provider API later.
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return mockSongs.filter((song) => (
    song.title.toLowerCase().includes(normalizedQuery)
    || song.artist.toLowerCase().includes(normalizedQuery)
  ));
}

export async function getSongDetails(songId) {
  // Replace this lookup with a real music provider API later.
  return mockSongs.find((song) => song.id === songId) || null;
}
