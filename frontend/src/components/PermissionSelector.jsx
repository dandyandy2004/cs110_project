export const permissionOptions = [
  {
    value: 1,
    title: 'Host only',
    description: 'Guests can listen and browse. Queue and playback stay with the host.',
  },
  {
    value: 2,
    title: 'Guests can queue',
    description: 'Guests can add songs and favorite tracks. Playback stays with the host.',
  },
  {
    value: 3,
    title: 'Guests can queue + play',
    description: 'Guests can add songs and use playback controls. Party settings stay private.',
  },
];

export default function PermissionSelector({ value, onChange, error }) {
  return (
    <fieldset className="permission-fieldset" aria-describedby={error ? 'permission-error' : undefined}>
      <legend>Guest permission level <span aria-hidden="true">*</span></legend>
      <p className="field-hint">The host always has full control.</p>
      <div className="permission-options">
        {permissionOptions.map((option) => (
          <label
            className={`permission-option ${Number(value) === option.value ? 'is-selected' : ''}`}
            key={option.value}
          >
            <input
              type="radio"
              name="permissionLevel"
              value={option.value}
              checked={Number(value) === option.value}
              onChange={onChange}
            />
            <span className="permission-number">{option.value}</span>
            <span className="permission-copy">
              <strong>Level {option.value} — {option.title}</strong>
              <small>{option.description}</small>
            </span>
            <span className="radio-indicator" aria-hidden="true" />
          </label>
        ))}
      </div>
      {error && <span className="field-error" id="permission-error">{error}</span>}
    </fieldset>
  );
}
