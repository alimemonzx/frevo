import styled, { keyframes } from "styled-components";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const FilterIconSvg = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
`;

const StarIconSvg = styled.svg`
  width: 1rem;
  height: 1rem;
`;

const SpinnerSvg = styled.svg`
  animation: ${spin} 1s linear infinite;
  width: 1rem;
  height: 1rem;
`;

const SpinnerCircle = styled.circle`
  opacity: 0.25;
`;

const SpinnerPath = styled.path`
  opacity: 0.75;
`;

export const FilterIcon = () => (
  <FilterIconSvg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
    />
  </FilterIconSvg>
);

export const StarIcon = () => (
  <StarIconSvg fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </StarIconSvg>
);

export const LoadingSpinner = () => (
  <SpinnerSvg fill="none" viewBox="0 0 24 24">
    <SpinnerCircle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <SpinnerPath
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </SpinnerSvg>
);
