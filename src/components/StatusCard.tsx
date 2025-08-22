interface StatusCardProps {
  isEnabled: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  onToggle: () => void;
  LoadingSpinner: React.ComponentType;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  isEnabled,
  isLoading,
  isTransitioning,
  onToggle,
  LoadingSpinner,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-3 ${
              isEnabled ? "bg-green-400 animate-pulse-soft" : "bg-gray-300"
            }`}
          ></div>
          <span className="text-sm font-medium text-gray-700">
            Frevo Status
          </span>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isEnabled
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isEnabled ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        disabled={isLoading || isTransitioning}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 ease-in-out
          ${
            isLoading || isTransitioning
              ? "bg-gray-400 cursor-not-allowed scale-95"
              : isEnabled
              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:scale-105 active:scale-95"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:scale-105 active:scale-95"
          }
          flex items-center justify-center space-x-2
        `}
      >
        {isLoading || isTransitioning ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : isEnabled ? (
          <>
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Turn OFF</span>
          </>
        ) : (
          <>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Turn ON</span>
          </>
        )}
      </button>
    </div>
  );
};
