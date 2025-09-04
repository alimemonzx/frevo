import styled from "styled-components";

interface OpenAIKeyInputProps {
  openAIKey: string;
  showKey: boolean;
  onKeyChange: (value: string) => void;
  onToggleShowKey: () => void;
}

const InputContainer = styled.div``;

const InputDescription = styled.div`
  margin-bottom: 0.75rem;
`;

const DescriptionText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  margin-top: 0;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #a855f7;
    border-color: transparent;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  transition: color 0.2s ease-in-out;
  border: none;
  background: none;
  cursor: pointer;

  &:hover {
    color: #4b5563;
  }
`;

const ButtonIcon = styled.svg`
  width: 0.75rem;
  height: 0.75rem;
`;

const StatusContainer = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
`;

const StatusDot = styled.div<{ $isValid: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: ${(props) => (props.$isValid ? "#4ade80" : "#f87171")};
`;

export const OpenAIKeyInput: React.FC<OpenAIKeyInputProps> = ({
  openAIKey,
  showKey,
  onKeyChange,
  onToggleShowKey,
}) => {
  return (
    <InputContainer>
      <InputDescription>
        <DescriptionText>
          Enter your OpenAI API key for AI features
        </DescriptionText>
      </InputDescription>

      <InputWrapper>
        <StyledInput
          type={showKey ? "text" : "password"}
          value={openAIKey}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="sk-..."
        />
        <ToggleButton type="button" onClick={onToggleShowKey}>
          {showKey ? (
            <ButtonIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </ButtonIcon>
          ) : (
            <ButtonIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </ButtonIcon>
          )}
        </ToggleButton>
      </InputWrapper>

      {openAIKey && (
        <StatusContainer>
          <StatusDot $isValid={openAIKey.startsWith("sk-")} />
          {openAIKey.startsWith("sk-") ? "Valid format" : "Invalid format"}
        </StatusContainer>
      )}
    </InputContainer>
  );
};
