export const mockSongs = [
  {
    id: 'song-1',
    title: 'Midnight Drive',
    artist: 'The Coastline',
    albumImage: '/albums/midnight-drive.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
  {
    id: 'song-2',
    title: 'Honey Static',
    artist: 'Mara June',
    albumImage: '/albums/honey-static.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
  {
    id: 'song-3',
    title: 'Soft Focus',
    artist: 'Day Window',
    albumImage: '/albums/soft-focus.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
  {
    id: 'song-4',
    title: 'After the Rain',
    artist: 'Juniper Lane',
    albumImage: '/albums/after-rain.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
  {
    id: 'song-5',
    title: 'Golden Hour',
    artist: 'Slow Meridian',
    albumImage: '/albums/golden-hour.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
  {
    id: 'song-6',
    title: 'Paper Planes',
    artist: 'Olive Street',
    albumImage: '/albums/paper-planes.svg',
    sourceType: 'placeholder',
    sourceId: null,
  },
];

export const initialQueue = mockSongs.slice(1, 4);
export const recommendedSongs = mockSongs.slice(4).concat(mockSongs[2]);
