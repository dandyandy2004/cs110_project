import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addSongToQueue,
  getPartyById,
  getTopSongs,
  skipCurrentSong,
  updateCurrentSong,
} from '../services/api';

import { useAuth } from './AuthContext';
import { useParty } from './PartyContext';

const MusicContext = createContext(null);

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeSong(song) {
  if (!song) {
    return null;
  }

  return {
    ...song,

    id: song.id,

    title:
      song.title ||
      song.trackName ||
      'Unknown title',

    artist:
      song.artist ||
      song.artistName ||
      'Unknown artist',

    imageUrl:
      song.imageUrl ||
      song.image_url ||
      song.albumImage ||
      song.artworkUrl100 ||
      null,

    previewUrl:
      song.previewUrl ||
      song.preview_url ||
      song.songUrl ||
      song.song_url ||
      null,

    submittedBy:
      song.submittedBy ||
      song.submitted_by ||
      null,

    submittedAt:
      song.submittedAt ||
      song.submitted_at ||
      null,

    voteScore:
      Number(
        song.voteScore ??
          song.vote_score ??
          0,
      ),
  };
}

function songsMatch(firstSong, secondSong) {
  return (
    normalizeText(firstSong?.title) ===
      normalizeText(secondSong?.title) &&
    normalizeText(firstSong?.artist) ===
      normalizeText(secondSong?.artist)
  );
}

export function MusicProvider({ children }) {
  const { token } = useAuth();
  const { currentParty } = useParty();

  const [currentSongIndex, setCurrentSongIndex] =
    useState(0);

  const [queue, setQueue] = useState([]);

  const [
    recommendedSongs,
    setRecommendedSongs,
  ] = useState([]);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [favoriteIds, setFavoriteIds] =
    useState([]);

  const [queueLoading, setQueueLoading] =
    useState(false);

  const [queueError, setQueueError] =
    useState('');

  const currentSong =
    queue.length > 0
      ? queue[
          currentSongIndex % queue.length
        ]
      : null;

  async function loadQueue(
    partyId = currentParty?.id,
  ) {
    if (!partyId) {
      setQueue([]);
      setCurrentSongIndex(0);
      setIsPlaying(false);

      return [];
    }

    setQueueLoading(true);
    setQueueError('');

    try {
      const data =
        await getPartyById(partyId);

      const rawSongs =
        data.songs ||
        data.party?.songs ||
        [];

      const songs = rawSongs
        .map(normalizeSong)
        .filter(Boolean);

      const backendCurrentSong =
        normalizeSong(
          data.currentSong ||
            data.party?.currentSong ||
            null,
        );

      const playbackStatus =
        data.playbackStatus ||
        data.playback_status ||
        data.party?.playbackStatus ||
        data.party?.playback_status ||
        'paused';

      setQueue(songs);

      if (backendCurrentSong?.id) {
        const activeSongIndex =
          songs.findIndex(
            (song) =>
              Number(song.id) ===
              Number(
                backendCurrentSong.id,
              ),
          );

        setCurrentSongIndex(
          activeSongIndex >= 0
            ? activeSongIndex
            : 0,
        );
      } else {
        setCurrentSongIndex(0);
      }

      setIsPlaying(
        playbackStatus === 'playing',
      );

      return songs;
    } catch (error) {
      setQueueError(
        error.message ||
          'Could not load the queue.',
      );

      throw error;
    } finally {
      setQueueLoading(false);
    }
  }

  async function loadRecommendedSongs() {
    try {
      const songs = await getTopSongs();

      setRecommendedSongs(
        songs
          .map(normalizeSong)
          .filter(Boolean),
      );
    } catch (error) {
      console.error(
        'Failed to load recommendations:',
        error,
      );
    }
  }

  useEffect(() => {
    if (!currentParty?.id) {
      return;
    }
  
    const interval = setInterval(() => {
      loadQueue(currentParty.id).catch((error) => {
        console.error('Could not synchronize party:', error);
      });
    }, 2000);
  
    return () => clearInterval(interval);
  }, [currentParty?.id]);

  useEffect(() => {
    if (!currentParty?.id) {
      setQueue([]);
      setCurrentSongIndex(0);
      setIsPlaying(false);
      setQueueError('');

      return;
    }

    loadQueue(currentParty.id).catch(
      (error) => {
        console.error(
          'Could not load party queue:',
          error,
        );
      },
    );
  }, [currentParty?.id]);

  useEffect(() => {
    loadRecommendedSongs();
  }, []);

  async function syncCurrentSong(
    song,
    playbackStatus,
  ) {
    if (!currentParty?.id) {
      throw new Error(
        'Select or create a party first.',
      );
    }

    if (!token) {
      throw new Error(
        'You must be logged in to control playback.',
      );
    }

    if (!song?.id) {
      throw new Error(
        'This song does not have a database ID.',
      );
    }

    return updateCurrentSong(
      currentParty.id,
      song.id,
      playbackStatus,
      token,
    );
  }

  async function playSong(song) {
    const songIndex = queue.findIndex(
      (queuedSong) =>
        Number(queuedSong.id) ===
        Number(song.id),
    );

    if (songIndex === -1) {
      throw new Error(
        'This song is not currently in the queue.',
      );
    }

    setQueueError('');

    try {
      await syncCurrentSong(
        song,
        'playing',
      );

      setCurrentSongIndex(songIndex);
      setIsPlaying(true);

      return song;
    } catch (error) {
      setQueueError(
        error.message ||
          'Could not play the song.',
      );

      throw error;
    }
  }

  async function togglePlayback() {
    if (!currentSong) {
      throw new Error(
        'There is no song to play.',
      );
    }

    if (!currentSong.previewUrl) {
      throw new Error(
        'This song does not have a preview URL.',
      );
    }

    const nextStatus = isPlaying
      ? 'paused'
      : 'playing';

    try {
      await syncCurrentSong(
        currentSong,
        nextStatus,
      );

      setIsPlaying(
        nextStatus === 'playing',
      );
    } catch (error) {
      setQueueError(
        error.message ||
          'Could not change playback.',
      );

      throw error;
    }
  }

  /*
    Skip deletes the current song from PostgreSQL.
  */
  async function nextSong() {
    if (!currentParty?.id) {
      throw new Error(
        'Select or create a party first.',
      );
    }

    if (!token) {
      throw new Error(
        'You must be logged in to skip songs.',
      );
    }

    if (!currentSong) {
      return;
    }

    setQueueError('');

    try {
      await skipCurrentSong(
        currentParty.id,
        token,
      );

      await loadQueue(currentParty.id);
    } catch (error) {
      setQueueError(
        error.message ||
          'Could not skip the song.',
      );

      throw error;
    }
  }

  async function previousSong() {
    if (queue.length === 0) {
      return;
    }

    const previousIndex =
      (currentSongIndex -
        1 +
        queue.length) %
      queue.length;

    const song = queue[previousIndex];

    try {
      await syncCurrentSong(
        song,
        'playing',
      );

      setCurrentSongIndex(
        previousIndex,
      );

      setIsPlaying(true);
    } catch (error) {
      setQueueError(
        error.message ||
          'Could not play the previous song.',
      );

      throw error;
    }
  }

  async function addToQueue(song) {
    if (!currentParty?.id) {
      throw new Error(
        'Select or create a party first.',
      );
    }

    if (!token) {
      throw new Error(
        'You must be logged in to add a song.',
      );
    }

    const normalizedSong =
      normalizeSong(song);

    const existingSong = queue.find(
      (queuedSong) =>
        songsMatch(
          queuedSong,
          normalizedSong,
        ),
    );

    if (existingSong) {
      throw new Error(
        'This song has already been submitted to the party.',
      );
    }

    setQueueLoading(true);
    setQueueError('');

    try {
      const createdSong =
        await addSongToQueue(
          currentParty.id,
          {
            title:
              normalizedSong.title,

            artist:
              normalizedSong.artist,

            imageUrl:
              normalizedSong.imageUrl,

            previewUrl:
              normalizedSong.previewUrl,

            songUrl:
              normalizedSong.previewUrl,

            genre:
              normalizedSong.genre ||
              null,
          },
          token,
        );

      await loadQueue(
        currentParty.id,
      );

      return normalizeSong(createdSong);
    } catch (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes('already')
      ) {
        await loadQueue(
          currentParty.id,
        );
      }

      setQueueError(
        error.message ||
          'Could not add the song.',
      );

      throw error;
    } finally {
      setQueueLoading(false);
    }
  }

  function toggleFavorite(songId) {
    setFavoriteIds((current) =>
      current.includes(songId)
        ? current.filter(
            (favoriteId) =>
              favoriteId !== songId,
          )
        : [...current, songId],
    );
  }

  const favoriteSongs = [
    ...recommendedSongs,
    ...queue,
  ].filter(
    (song, index, songs) =>
      favoriteIds.includes(song.id) &&
      songs.findIndex(
        (item) => item.id === song.id,
      ) === index,
  );

  const value = useMemo(
    () => ({
      currentSong,
      queue,
      recommendedSongs,
      isPlaying,
      favoriteIds,
      favoriteSongs,
      queueLoading,
      queueError,
      togglePlayback,
      nextSong,
      previousSong,
      addToQueue,
      playSong,
      loadQueue,
      toggleFavorite,
    }),
    [
      currentSong,
      queue,
      recommendedSongs,
      isPlaying,
      favoriteIds,
      favoriteSongs,
      queueLoading,
      queueError,
      currentParty,
      token,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(
    MusicContext,
  );

  if (!context) {
    throw new Error(
      'useMusic must be used within MusicProvider',
    );
  }

  return context;
}