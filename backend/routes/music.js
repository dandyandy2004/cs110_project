const express = require("express");

const router = express.Router();

function formatSong(song) {
  return {
    providerId: String(song.trackId),
    id: String(song.trackId),
    title: song.trackName,
    artist: song.artistName,
    album: song.collectionName || "",
    imageUrl:
      song.artworkUrl100?.replace(
        "100x100bb",
        "400x400bb",
      ) || song.artworkUrl100 || "",
    previewUrl: song.previewUrl || null,
    duration: song.trackTimeMillis || 0,
    externalUrl: song.trackViewUrl || "",
  };
}

async function fetchITunesSongs(
  term,
  limit = 25,
) {
  const url =
    "https://itunes.apple.com/search" +
    `?term=${encodeURIComponent(term)}` +
    "&country=US" +
    "&media=music" +
    "&entity=song" +
    `&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PartyMusicApp/1.0",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(
      `iTunes returned status ${response.status}`,
    );
  }

  const data = await response.json();

  return Array.isArray(data.results)
    ? data.results.map(formatSong)
    : [];
}

router.get("/top", async (req, res) => {
  try {
    /*
      The Search API does not provide a true Top 50 chart,
      so this uses a broad query for the default recommendations.
    */
    const songs = await fetchITunesSongs(
      "popular hits",
      25,
    );

    res.json(songs);
  } catch (error) {
    console.error(
      "Could not load recommended songs:",
      error,
    );

    res.status(502).json({
      error:
        "Could not reach the iTunes service.",
    });
  }
});

router.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({
      error: "A search query is required.",
    });
  }

  try {
    const songs = await fetchITunesSongs(
      query,
      25,
    );

    return res.json(songs);
  } catch (error) {
    console.error(
      "Could not search for songs:",
      error,
    );

    return res.status(502).json({
      error:
        "Could not reach the iTunes service.",
    });
  }
});

module.exports = router;