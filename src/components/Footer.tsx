import styled from "styled-components";

const FooterContainer = styled.div`
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterText>
        Filter on search pages • AI assist on project details
      </FooterText>
    </FooterContainer>
  );
};
