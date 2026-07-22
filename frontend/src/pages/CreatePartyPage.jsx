import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PermissionSelector from '../components/PermissionSelector';
import { useParty } from '../context/PartyContext';

const genres = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Other'];

export default function CreatePartyPage() {
  const navigate = useNavigate();
  const { createMockParty } = useParty();
  const [form, setForm] = useState({
    name: '',
    genre: '',
    description: '',
    visibility: 'public',
    permissionLevel: 2,
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function submit(event) {
    event.preventDefault();
  
    const nextErrors = {};
  
    if (!form.name.trim()) {
      nextErrors.name = 'Enter a party name.';
    }
  
    if (!form.genre) {
      nextErrors.genre = 'Choose a genre.';
    }
  
    if (!form.visibility) {
      nextErrors.visibility = 'Choose a visibility.';
    }
  
    if (!form.permissionLevel) {
      nextErrors.permissionLevel = 'Choose a permission level.';
    }
  
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
  
    try {
      const party = await createMockParty({
        name: form.name.trim(),
        description: form.description.trim(),
        genre: form.genre,
        visibility: form.visibility,
        permissionLevel: Number(form.permissionLevel),
      });
  
      navigate('/home', {
        replace: true,
        state: {
          message: `“${party.name}” is live. Room code: ${party.roomCode}`,
        },
      });
    } catch (error) {
      setErrors({
        form: error.message,
      });
    }
  }

  return (
    <main className="create-page page-container">
      <div className="page-heading">
              <p className="eyebrow">Start the room</p>
              <h1>Create a party</h1>
              <p>Set the tone and decide how much control to share with the crowd.</p>
        </div>

            {errors.form && (
              <div className="inline-notice" role="alert">
                {errors.form}
              </div>
            )}

            <form className="create-card" onSubmit={submit} noValidate>
        <section className="form-section" aria-labelledby="basics-heading">
          <div className="form-section-heading">
            <span>01</span>
            <div><h2 id="basics-heading">Party basics</h2><p>Give your room a name and a little context.</p></div>
          </div>
          <div className="form-grid">
            <div className="form-field wide-field">
              <label htmlFor="name">Party name <span aria-hidden="true">*</span></label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Friday Night Mix"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span className="field-error" id="name-error">{errors.name}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="genre">Genre <span aria-hidden="true">*</span></label>
              <select
                id="genre"
                name="genre"
                value={form.genre}
                onChange={updateField}
                aria-invalid={Boolean(errors.genre)}
                aria-describedby={errors.genre ? 'genre-error' : undefined}
              >
                <option value="">Choose a genre</option>
                {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              {errors.genre && <span className="field-error" id="genre-error">{errors.genre}</span>}
            </div>
            <div className="form-field wide-field">
              <label htmlFor="description">Description <span className="optional-label">Optional</span></label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="What kind of night is this?"
                rows="3"
              />
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="access-heading">
          <div className="form-section-heading">
            <span>02</span>
            <div><h2 id="access-heading">Room access</h2><p>Both options use a room code in this demo.</p></div>
          </div>
          <fieldset className="visibility-fieldset">
            <legend>Visibility <span aria-hidden="true">*</span></legend>
            <div className="segmented-options">
              <label className={form.visibility === 'public' ? 'is-selected' : ''}>
                <input type="radio" name="visibility" value="public" checked={form.visibility === 'public'} onChange={updateField} />
                <span aria-hidden="true">◎</span>
                <strong>Public</strong>
                <small>Open and discoverable</small>
              </label>
              <label className={form.visibility === 'private' ? 'is-selected' : ''}>
                <input type="radio" name="visibility" value="private" checked={form.visibility === 'private'} onChange={updateField} />
                <span aria-hidden="true">◇</span>
                <strong>Private</strong>
                <small>Invite by room code</small>
              </label>
            </div>
            {errors.visibility && <span className="field-error">{errors.visibility}</span>}
          </fieldset>
        </section>

        <section className="form-section" aria-labelledby="permissions-heading">
          <div className="form-section-heading">
            <span>03</span>
            <div><h2 id="permissions-heading">Set the energy</h2><p>Choose what guests can do once they arrive.</p></div>
          </div>
          <PermissionSelector value={form.permissionLevel} onChange={updateField} error={errors.permissionLevel} />
        </section>

        <div className="create-form-actions">
          <button className="button button-ghost" type="button" onClick={() => navigate('/home')}>Cancel</button>
          <button className="button button-primary create-submit" type="submit">
            Create party <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </main>
  );
}
