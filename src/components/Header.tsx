import styled from "styled-components";

interface HeaderProps {
  FilterIcon: React.ComponentType;
}

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(to right, #3b82f6, #4f46e5);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const TextContainer = styled.div`
  margin-left: 0.5rem;
`;

const Title = styled.h1`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

export const Header: React.FC<HeaderProps> = ({ FilterIcon }) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <IconContainer>
          <FilterIcon />
        </IconContainer>
        <TextContainer>
          <Title>Frevo</Title>
          <Subtitle>Freelancer.com Enhancement</Subtitle>
        </TextContainer>
      </HeaderContent>
    </HeaderContainer>
  );
};
