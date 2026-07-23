const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  

export function getApiBaseUrl() {
  return API_BASE_URL;
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

export async function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
}
export async function joinPartyByCode(roomCode) {
  return apiRequest(
    `/parties/code/${encodeURIComponent(roomCode.trim().toUpperCase())}`,
  );
}
export async function updateCurrentSong(
  partyId,
  songId,
  playbackStatus,
  token,
) {
  return apiRequest(`/parties/${partyId}/current-song`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      songId,
      playbackStatus,
    }),
  });
}

export async function skipCurrentSong(
  partyId,
  token,
) {
  return apiRequest(
    `/parties/${partyId}/skip`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}


export async function createParty(partyData, token) {
  return apiRequest('/parties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(partyData),
  });
}

export async function getParties() {
  return apiRequest('/parties');
}

export async function getPartyById(partyId) {
  return apiRequest(`/parties/${partyId}`);
}
export async function getTopSongs() {
  return apiRequest("/music/top");
}
export async function addSongToQueue(partyId, songData, token) {
  return apiRequest(`/songs/party/${partyId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(songData),
  });
}

export async function voteOnSong(songId, voteValue, token) {
  return apiRequest(`/votes/song/${songId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      voteValue: voteValue,
    }),
  });
}

export async function addComment(songId, content, token) {
  return apiRequest(`/comments/song/${songId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      commentText: commentText,
    }),
  });
}

export async function getUserProfile(userId, token) {
  return apiRequest(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateUserProfile(userId, profileData, token) {
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
}