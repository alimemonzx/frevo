interface OpenAIKeyInputProps {
  openAIKey: string;
  showKey: boolean;
  onKeyChange: (value: string) => void;
  onToggleShowKey: () => void;
}

export const OpenAIKeyInput: React.FC<OpenAIKeyInputProps> = ({
  openAIKey,
  showKey,
  onKeyChange,
  onToggleShowKey,
}) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mr-3">
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            OpenAI API Key
          </h3>
          <p className="text-xs text-gray-500">Required for AI features</p>
        </div>
      </div>

      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={openAIKey}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
        />
        <button
          type="button"
          onClick={onToggleShowKey}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showKey ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {openAIKey && (
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              openAIKey.startsWith("sk-") ? "bg-green-400" : "bg-red-400"
            }`}
          ></div>
          {openAIKey.startsWith("sk-") ? "Valid format" : "Invalid format"}
        </div>
      )}
    </div>
  );
};
