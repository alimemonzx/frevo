import styled, { keyframes } from "styled-components";

interface StatusCardProps {
  isEnabled: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  onToggle: () => void;
  LoadingSpinner: React.ComponentType;
}

// Animations
const pulseSoft = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

// Styled Components
const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
`;

const StatusDot = styled.div<{ $isEnabled: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: ${(props) => (props.$isEnabled ? "#4ade80" : "#d1d5db")};
  animation: ${(props) => (props.$isEnabled ? pulseSoft : "none")} 2s infinite;
`;

const StatusBadge = styled.div<{ $isEnabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${(props) => (props.$isEnabled ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$isEnabled ? "#166534" : "#4b5563")};
`;

const ToggleButton = styled.button<{
  $isEnabled: boolean;
  $isLoading: boolean;
  $isTransitioning: boolean;
}>`
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: scale(1);
  transition: all 0.2s ease-in-out;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;

  ${(props) => {
    if (props.$isLoading || props.$isTransitioning) {
      return `
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: scale(0.95);
      `;
    } else if (props.$isEnabled) {
      return `
        background: linear-gradient(to right, #ef4444, #dc2626);
        &:hover {
          background: linear-gradient(to right, #dc2626, #b91c1c);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: scale(1.05);
        }
        &:active {
          transform: scale(0.95);
        }
      `;
    } else {
      return `
        background: linear-gradient(to right, #10b981, #059669);
        &:hover {
          background: linear-gradient(to right, #059669, #047857);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: scale(1.05);
        }
        &:active {
          transform: scale(0.95);
        }
      `;
    }
  }}
`;

const ButtonIcon = styled.svg`
  width: 0.75rem;
  height: 0.75rem;
`;

export const StatusCard: React.FC<StatusCardProps> = ({
  isEnabled,
  isLoading,
  isTransitioning,
  onToggle,
  LoadingSpinner,
}) => {
  return (
    <StatusContainer>
      <StatusInfo>
        <StatusDot $isEnabled={isEnabled} />
        <StatusBadge $isEnabled={isEnabled}>
          {isEnabled ? "Active" : "Inactive"}
        </StatusBadge>
      </StatusInfo>

      <ToggleButton
        onClick={onToggle}
        disabled={isLoading || isTransitioning}
        $isEnabled={isEnabled}
        $isLoading={isLoading}
        $isTransitioning={isTransitioning}
      >
        {isLoading || isTransitioning ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : isEnabled ? (
          <>
            <ButtonIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </ButtonIcon>
            <span>Turn OFF</span>
          </>
        ) : (
          <>
            <ButtonIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </ButtonIcon>
            <span>Turn ON</span>
          </>
        )}
      </ToggleButton>
    </StatusContainer>
  );
};
