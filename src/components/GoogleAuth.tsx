import React, { useState } from "react";
import styled from "styled-components";

interface GoogleAuthProps {
  onAuthSuccess: (user: {
    email: string;
    name: string;
    picture: string;
  }) => void;
  onAuthError: (error: string) => void;
}

// Styled Components
const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
`;

const BrandingSection = styled.div`
  margin-bottom: 2rem;
`;

const Logo = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(to right, #8b5cf6, #2563eb);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const LogoIcon = styled.svg`
  width: 2rem;
  height: 2rem;
  color: white;
`;

const BrandTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const BrandSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const BrandDescription = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
`;

const AuthSection = styled.div`
  width: 100%;
  max-width: 20rem;
`;

const AuthTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const AuthDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
`;

const GoogleButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleIcon = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
`;

const LoadingSpinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const FeaturesList = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const FeatureIcon = styled.span`
  font-size: 1rem;
`;

const FeatureText = styled.span`
  font-size: 0.8rem;
  color: #6b7280;
`;

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onAuthSuccess,
  onAuthError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      if (typeof chrome !== "undefined" && chrome.identity) {
        // Use Chrome Identity API for OAuth
        chrome.identity.getAuthToken(
          {
            interactive: true,
            scopes: ["openid", "email", "profile"],
          },
          async (token) => {
            if (chrome.runtime.lastError) {
              console.error("Auth error:", chrome.runtime.lastError);
              setIsLoading(false);
              onAuthError(
                chrome.runtime.lastError.message || "Authentication failed"
              );
              return;
            }

            if (!token) {
              setIsLoading(false);
              onAuthError("No token received");
              return;
            }

            try {
              // Get user info from Google API
              const response = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
              );

              if (!response.ok) {
                throw new Error("Failed to fetch user info");
              }

              const userInfo = await response.json();

              const user = {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
              };

              console.log("✅ Google auth successful:", user);
              onAuthSuccess(user);
              setIsLoading(false);
            } catch (apiError) {
              console.error("Error fetching user info:", apiError);
              setIsLoading(false);
              onAuthError("Failed to get user information");
            }
          }
        );
      } else {
        // Fallback for development or if Chrome Identity API is not available
        console.warn("Chrome Identity API not available, using mock auth");
        setTimeout(() => {
          const mockUser = {
            email: "user@example.com",
            name: "John Doe",
            picture: "https://via.placeholder.com/40",
          };

          onAuthSuccess(mockUser);
          setIsLoading(false);
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      onAuthError(
        error instanceof Error ? error.message : "Authentication failed"
      );
    }
  };

  return (
    <AuthContainer>
      <BrandingSection>
        <Logo>
          <LogoIcon viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </LogoIcon>
        </Logo>
        <BrandTitle>Frevo</BrandTitle>
        <BrandSubtitle>Freelancer.com Enhancement Suite</BrandSubtitle>
        <BrandDescription>
          Smart filtering & AI-powered proposal generation
        </BrandDescription>
      </BrandingSection>

      <AuthSection>
        <AuthTitle>Get Started</AuthTitle>
        <AuthDescription>
          Sign in with your Google account to unlock powerful features for
          Freelancer.com
        </AuthDescription>

        <GoogleButton
          onClick={handleGoogleAuth}
          disabled={isLoading}
          $isLoading={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <GoogleIcon viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </GoogleIcon>
              <span>Continue with Google</span>
            </>
          )}
        </GoogleButton>
      </AuthSection>

      <FeaturesList>
        <Feature>
          <FeatureIcon>⭐</FeatureIcon>
          <FeatureText>Filter projects by star rating</FeatureText>
        </Feature>
        <Feature>
          <FeatureIcon>🤖</FeatureIcon>
          <FeatureText>AI-powered proposal generation</FeatureText>
        </Feature>
        <Feature>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureText>Enhanced project browsing</FeatureText>
        </Feature>
      </FeaturesList>
    </AuthContainer>
  );
};

export default GoogleAuth;
