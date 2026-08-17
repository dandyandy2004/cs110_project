import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ identifier: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [providerMessage, setProviderMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const nextErrors = {};
    if (mode === 'login') {
      if (!form.identifier.trim()) {
        nextErrors.identifier = 'Enter an email address.';
      } else if (!emailPattern.test(form.identifier)) {
        nextErrors.identifier = 'Enter a valid email address.';
      }
    }
    if (!form.password) nextErrors.password = 'Enter a password.';
    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();
  
    const nextErrors = validate();
  
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
  
    try {
      if (mode === 'login') {
        await login(
          form.identifier.trim(),
          form.password
        );
      } else {
        await signup({
          username: form.username.trim(),
          displayName: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          favoriteGenres: [],
        });
      }
  
      navigate(location.state?.from || '/home', {
        replace: true,
        state: {
          message: `Welcome ${mode === 'login' ? 'back' : 'to the crowd'}!`,
        },
      });
    } catch (error) {
      setErrors({
        form: error.message,
      });
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setProviderMessage('');
  }

  return (
    <main className="auth-page page-container">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand" aria-hidden="true"><BrandMark /></div>
        <p className="eyebrow">Welcome to Crowd DJ</p>
        <h1 id="auth-title">{mode === 'login' ? 'Find your way back in.' : 'Join the listening room.'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Your next shared soundtrack is waiting.' : 'Make rooms, save favorites, and shape the queue.'}
        </p>

        {location.state?.message && <div className="inline-notice" role="status">{location.state.message}</div>}

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => changeMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'is-active' : ''}
            onClick={() => changeMode('signup')}
          >
            Sign up
          </button>
        </div>
        {errors.form && (
        <div className="inline-notice" role="alert">
          {errors.form}
        </div>
        )}
        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'login' ? (
            <FormField
              id="identifier"
              label="Email"
              type="email"
              value={form.identifier}
              onChange={updateField}
              error={errors.identifier}
              autoComplete="email"
              placeholder="you@example.com"
            />
          ) : (
            <>
              <FormField
                id="username"
                label="Username"
                value={form.username}
                onChange={updateField}
                error={errors.username}
                autoComplete="username"
                placeholder="your_username"
              />
              <FormField
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={updateField}
                error={errors.email}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </>
          )}
          <FormField
            id="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={updateField}
            error={errors.password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
          />
          <button className="button button-primary button-full auth-submit" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="or-divider"><span>OR</span></div>
        <button
          className="button google-button button-full"
          type="button"
          onClick={() => setProviderMessage('Google sign-in is a placeholder in this frontend demo.')}
        >
          <span className="google-mark" aria-hidden="true">G</span>
          Continue with Google
        </button>
        {providerMessage && <p className="provider-message" role="status">{providerMessage}</p>}
      </section>
    </main>
  );
}

function FormField({ id, label, type = 'text', value, onChange, error, ...props }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}
