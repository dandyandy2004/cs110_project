import { getPermissionLabel } from '../utils/permissions';

export default function PartyInfoCard({ party, role, onInvite, onJoin, onCreate }) {
  return (
    <section className="party-card" aria-labelledby="party-title">
      <div className="party-card-copy">
        <div className="party-eyebrow">
          <span className="live-dot" aria-hidden="true" />
          Live party
          <span aria-hidden="true">·</span>
          {party.genre}
        </div>
        <h1 id="party-title">{party.name}</h1>
        <p>Hosted by <strong>@{party.hostUsername}</strong></p>
      </div>
      <div className="party-card-side">
        <span className="permission-pill">
          {role === 'host' ? 'You’re the host' : getPermissionLabel(party.permissionLevel)}
        </span>
        <div className="party-actions" aria-label="Party actions">
          <button className="button button-ghost" type="button" onClick={onInvite}>Invite</button>
          <button className="button button-secondary" type="button" onClick={onJoin}>Join party</button>
          <button className="button button-primary" type="button" onClick={onCreate}>Create party</button>
        </div>
      </div>
    </section>
  );
}
