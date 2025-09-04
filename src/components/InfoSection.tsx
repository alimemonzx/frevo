import styled from "styled-components";

interface InfoSectionProps {
  StarIcon: React.ComponentType;
}

const InfoContainer = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  padding: 0.75rem;
`;

const InfoContent = styled.div`
  display: flex;
  align-items: center;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background-color: #fef3c7;
  border-radius: 0.5rem;
  margin-right: 0.5rem;
`;

const TextContainer = styled.div``;

const Title = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Description = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

export const InfoSection: React.FC<InfoSectionProps> = ({ StarIcon }) => {
  return (
    <InfoContainer>
      <InfoContent>
        <IconContainer>
          <StarIcon />
        </IconContainer>
        <TextContainer>
          <Title>Star Rating Filter</Title>
          <Description>
            Filter projects by minimum star rating on search pages
          </Description>
        </TextContainer>
      </InfoContent>
    </InfoContainer>
  );
};
