import React from "react";
import styled from "styled-components";

interface User {
  email: string;
  name: string;
  picture: string;
  package_type?: "basic" | "plus" | "premium";
  daily_usage?: {
    proposals: {
      used: number;
      limit: number;
      remaining: number;
    };
    user_detail_views: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

// Styled Components
const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const UsageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
`;

const UsageItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
`;

const UsageLabel = styled.span`
  color: #6b7280;
`;

const UsageValue = styled.span`
  color: #111827;
  font-weight: 500;
`;

const UsageBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
`;

const UsageProgress = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${(props) => props.percentage}%;
  background-color: ${(props) => props.color};
  transition: width 0.3s ease-in-out;
`;

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const dailyUsage = user.daily_usage;

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 70) return "#f59e0b";
    return "#10b981";
  };

  const formatLimit = (limit: number) => {
    return limit > 100000 ? "Unlimited" : limit.toString();
  };

  return (
    <ProfileContainer>
      <ProfileHeader>
        <UserInfo>
          <UserAvatar src={user.picture} alt={user.name} />
          <UserDetails>
            <UserName>{user.name}</UserName>
            <UserEmail>{user.email}</UserEmail>
          </UserDetails>
        </UserInfo>
        <LogoutButton onClick={onLogout}>Sign out</LogoutButton>
      </ProfileHeader>

      {dailyUsage && dailyUsage.user_detail_views && dailyUsage.proposals && (
        <UsageSection>
          <UsageItem>
            <UsageLabel>Profile Views</UsageLabel>
            <UsageValue>
              {dailyUsage.user_detail_views.remaining} /{" "}
              {formatLimit(dailyUsage.user_detail_views.limit)} left
            </UsageValue>
          </UsageItem>
          <UsageBar>
            <UsageProgress
              percentage={
                (dailyUsage.user_detail_views.used /
                  dailyUsage.user_detail_views.limit) *
                100
              }
              color={getUsageColor(
                dailyUsage.user_detail_views.used,
                dailyUsage.user_detail_views.limit
              )}
            />
          </UsageBar>

          <UsageItem>
            <UsageLabel>Proposals</UsageLabel>
            <UsageValue>
              {dailyUsage.proposals.remaining} /{" "}
              {formatLimit(dailyUsage.proposals.limit)} left
            </UsageValue>
          </UsageItem>
          <UsageBar>
            <UsageProgress
              percentage={
                (dailyUsage.proposals.used / dailyUsage.proposals.limit) * 100
              }
              color={getUsageColor(
                dailyUsage.proposals.used,
                dailyUsage.proposals.limit
              )}
            />
          </UsageBar>
        </UsageSection>
      )}
    </ProfileContainer>
  );
};

export default UserProfile;
