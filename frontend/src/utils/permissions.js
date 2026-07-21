// The backend must enforce these rules too. Frontend checks improve the UI,
// but they are not a security boundary.
export function isPartyHost(role) {
  return role === 'host';
}

export function canGuestAddToQueue(permissionLevel) {
  return Number(permissionLevel) >= 2;
}

export function canGuestControlPlayback(permissionLevel) {
  return Number(permissionLevel) >= 3;
}

export function canGuestManageQueue() {
  return false;
}

export function canAddToQueue(role, permissionLevel) {
  return isPartyHost(role) || canGuestAddToQueue(permissionLevel);
}

export function canControlPlayback(role, permissionLevel) {
  return isPartyHost(role) || canGuestControlPlayback(permissionLevel);
}

export function canUseFavorites(role, permissionLevel) {
  return isPartyHost(role) || canGuestAddToQueue(permissionLevel);
}

export function getPermissionLabel(permissionLevel) {
  const labels = {
    1: 'Host controls',
    2: 'Guests can queue',
    3: 'Guests can queue + play',
  };
  return labels[Number(permissionLevel)] || labels[1];
}
