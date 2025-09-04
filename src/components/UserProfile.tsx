import React from "react";
import styled from "styled-components";

interface User {
  email: string;
  name: string;
  picture: string;
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

// Styled Components
const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserAvatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const UserEmail = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const LogoutButton = styled.button`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #ef4444;
    border-color: #fca5a5;
    background-color: #fef2f2;
  }
`;

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  return (
    <ProfileContainer>
      <UserInfo>
        <UserAvatar src={user.picture} alt={user.name} />
        <UserDetails>
          <UserName>{user.name}</UserName>
          <UserEmail>{user.email}</UserEmail>
        </UserDetails>
      </UserInfo>
      <LogoutButton onClick={onLogout}>Sign out</LogoutButton>
    </ProfileContainer>
  );
};

export default UserProfile;
