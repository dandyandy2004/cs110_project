import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createParty as createPartyRequest,
  getPartyById,
  joinPartyByCode,
} from '../services/api';

import { useAuth } from './AuthContext';

const PartyContext = createContext(null);
const PARTY_STORAGE_KEY = 'crowd-dj-party';

function getStoredParty() {
  try {
    const storedParty = localStorage.getItem(PARTY_STORAGE_KEY);

    return storedParty
      ? JSON.parse(storedParty)
      : null;
  } catch {
    return null;
  }
}

function normalizeParty(party) {
  if (!party) {
    return null;
  }

  return {
    ...party,

    roomCode:
      party.roomCode ??
      party.join_code ??
      party.room_code ??
      null,

    permissionLevel: Number(
      party.permissionLevel ??
      party.permission_level ??
      2,
    ),

    hostUsername:
      party.hostUsername ??
      party.host_username ??
      null,
  };
}

export function PartyProvider({ children }) {
  const { user, token } = useAuth();

  const [currentParty, setCurrentParty] = useState(() =>
    normalizeParty(getStoredParty()),
  );

  const [partyLoading, setPartyLoading] = useState(false);
  const [partyError, setPartyError] = useState('');

  useEffect(() => {
    if (!currentParty?.id) {
      return undefined;
    }
  
    const refreshParty = async () => {
      try {
        const updatedParty = await getPartyById(currentParty.id);
        saveParty(updatedParty);
      } catch (error) {
        console.error('Could not refresh party:', error);
      }
    };
  
    refreshParty();
  
    const intervalId = setInterval(refreshParty, 2000);
  
    return () => clearInterval(intervalId);
  }, [currentParty?.id]);

  const currentRole =
    user &&
    currentParty &&
    (
      Number(user.id) === Number(currentParty.host_id) ||
      user.username === currentParty.hostUsername
    )
      ? 'host'
      : 'guest';

  function saveParty(party) {
    const normalizedParty = normalizeParty(party);

    setCurrentParty(normalizedParty);

    if (normalizedParty) {
      localStorage.setItem(
        PARTY_STORAGE_KEY,
        JSON.stringify(normalizedParty),
      );
    } else {
      localStorage.removeItem(PARTY_STORAGE_KEY);
    }
  }

  async function createMockParty(partyData) {
    if (!token) {
      throw new Error(
        'You must be logged in to create a party.',
      );
    }

    setPartyLoading(true);
    setPartyError('');

    try {
      const createdParty = await createPartyRequest(
        partyData,
        token,
      );

      const party = normalizeParty(createdParty);

      saveParty(party);

      return party;
    } catch (error) {
      setPartyError(error.message);
      throw error;
    } finally {
      setPartyLoading(false);
    }
  }

  async function joinMockParty(roomCode) {
    if (!roomCode || !roomCode.trim()) {
      throw new Error('Enter a room code.');
    }

    setPartyLoading(true);
    setPartyError('');

    try {
      const partyData = await joinPartyByCode(roomCode);

      const party = normalizeParty(partyData);

      saveParty(party);

      return party;
    } catch (error) {
      setPartyError(error.message);
      throw error;
    } finally {
      setPartyLoading(false);
    }
  }

  async function loadParty(partyId) {
    setPartyLoading(true);
    setPartyError('');

    try {
      const partyData = await getPartyById(partyId);

      const party = normalizeParty(partyData);

      saveParty(party);

      return party;
    } catch (error) {
      setPartyError(error.message);
      throw error;
    } finally {
      setPartyLoading(false);
    }
  }

  function leaveParty() {
    saveParty(null);
  }

  

  const value = useMemo(
    () => ({
      currentParty,
      currentRole,
      partyLoading,
      partyError,
      createMockParty,
      joinMockParty,
      loadParty,
      leaveParty,
    }),
    [
      currentParty,
      currentRole,
      partyLoading,
      partyError,
      token,
      user,
    ],
  );

  return (
    <PartyContext.Provider value={value}>
      {children}
    </PartyContext.Provider>
  );
}

export function useParty() {
  const context = useContext(PartyContext);

  if (!context) {
    throw new Error(
      'useParty must be used within PartyProvider',
    );
  }

  return context;
}
