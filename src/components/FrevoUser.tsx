import React from "react";
import styled from "styled-components";

interface FrevoUserProps {
  image: string;
  name: string;
  username: string;
}

const UserContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ImageContainer = styled.div`
  flex-shrink: 0;
`;

const UserImage = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const Username = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const FrevoUser: React.FC<FrevoUserProps> = ({ image, name, username }) => {
  const shouldShowUsername = name !== username;

  return (
    <UserContainer>
      <ImageContainer>
        <UserImage src={image} alt={`${name}'s profile`} />
      </ImageContainer>
      <UserInfo>
        <UserName>{name}</UserName>
        {shouldShowUsername && <Username>@{username}</Username>}
      </UserInfo>
    </UserContainer>
  );
};

export default FrevoUser;
