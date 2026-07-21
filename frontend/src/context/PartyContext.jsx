import { createContext, useContext, useMemo, useState } from 'react';
import { mockParty } from '../data/mockParty';
import { useAuth } from './AuthContext';

const PartyContext = createContext(null);
const PARTY_STORAGE_KEY = 'crowd-dj-party';

function getStoredParty() {
  try {
    return JSON.parse(localStorage.getItem(PARTY_STORAGE_KEY)) || mockParty;
  } catch {
    return mockParty;
  }
}

function generateRoomCode() {
  return `CDJ-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function PartyProvider({ children }) {
  const { user } = useAuth();
  const [currentParty, setCurrentParty] = useState(getStoredParty);

  const currentRole = user?.username === currentParty.hostUsername ? 'host' : 'guest';

  function saveParty(party) {
    setCurrentParty(party);
    localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(party));
  }

  function createMockParty(partyData) {
    const party = {
      ...partyData,
      id: `party-${Date.now()}`,
      hostUsername: user.username,
      permissionLevel: Number(partyData.permissionLevel),
      roomCode: generateRoomCode(),
    };
    saveParty(party);
    return party;
  }

  function joinMockParty(roomCode) {
    const party = {
      ...mockParty,
      id: `joined-${roomCode.toLowerCase()}`,
      name: 'Room Code Radio',
      description: 'You are browsing a shared party in guest mode.',
      roomCode: roomCode.toUpperCase(),
    };
    saveParty(party);
    return party;
  }

  const value = useMemo(
    () => ({ currentParty, currentRole, createMockParty, joinMockParty }),
    [currentParty, currentRole],
  );

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty() {
  const context = useContext(PartyContext);
  if (!context) throw new Error('useParty must be used within PartyProvider');
  return context;
}
