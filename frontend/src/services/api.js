const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// This module is the future REST boundary. Components should call functions
// here (or context actions that call them) instead of using fetch directly.
export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function loginUser(credentials) {
  // Replace with POST /auth/login later.
  return { mock: true, credentials };
}

export async function registerUser(userData) {
  // Replace with POST /auth/register later.
  return { mock: true, userData };
}

export async function createParty(partyData) {
  // Replace with POST /parties later.
  return { mock: true, partyData };
}

export async function joinParty(roomCode) {
  // Replace with the agreed party-by-code endpoint later.
  return { mock: true, roomCode };
}

export async function getPartyByCode(roomCode) {
  // Replace with the backend REST endpoint later.
  return { mock: true, roomCode };
}

export async function getQueue(partyId) {
  // Replace with the backend REST endpoint later.
  return { mock: true, partyId, songs: [] };
}

export async function addSongToQueue(partyId, songData) {
  // Replace with the backend REST endpoint later.
  return { mock: true, partyId, songData };
}

export async function updatePlayback(partyId, action) {
  // Replace with the backend REST endpoint later.
  return { mock: true, partyId, action };
}

export async function getUserProfile() {
  // Replace with the backend REST endpoint later.
  return { mock: true };
}

export async function updateUserProfile(profileData) {
  // Replace with the backend REST endpoint later.
  return { mock: true, profileData };
}

export async function getFavoriteSongs() {
  // Replace with the backend REST endpoint later.
  return { mock: true, songs: [] };
}

export async function toggleFavoriteSong(songId) {
  // Replace with the backend REST endpoint later.
  return { mock: true, songId };
}
