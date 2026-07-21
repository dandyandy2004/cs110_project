import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isEvening = theme === 'evening';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isEvening ? 'light' : 'evening'} theme`}
      title={`Switch to ${isEvening ? 'light' : 'evening'} theme`}
    >
      <span aria-hidden="true">{isEvening ? '☀' : '☾'}</span>
    </button>
  );
}
