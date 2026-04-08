import { useApp } from "../context/AppContext";

const LANGUAGES = [
  { code: "ar", label: "Arabic" },
  { code: "da", label: "Danish" },
  { code: "de", label: "German" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "nl", label: "Dutch" },
  { code: "pt", label: "Portuguese" },
];

export const LanguageSelect = () => {
  const { language, setLanguage } = useApp();

  return (
    <div className="relative w-16">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-transparent transition-colors appearance-none cursor-pointer hover:bg-white/20"
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
            {`${lang.label} (${lang.code})`}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-white uppercase">
        {language}
      </span>
    </div>
  );
};
