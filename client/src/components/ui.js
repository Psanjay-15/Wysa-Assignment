import styled, { css, keyframes } from "styled-components";

export const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.large};
  box-shadow: ${({ theme, $elevated }) =>
    $elevated ? theme.shadow.medium : theme.shadow.small};
`;

const buttonVariants = {
  primary: css`
    color: #fff;
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryDark};
      border-color: ${({ theme }) => theme.colors.primaryDark};
      transform: translateY(-1px);
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.borderStrong};

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.primaryDark};
      background: ${({ theme }) => theme.colors.surfaceMuted};
    }
  `,
  ghost: css`
    color: ${({ theme }) => theme.colors.textSoft};
    background: transparent;
    border-color: transparent;

    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.colors.text};
      background: ${({ theme }) => theme.colors.surfaceMuted};
    }
  `,
  danger: css`
    color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerSoft};
    border-color: transparent;
  `,
};

export const Button = styled.button`
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: ${({ $compact }) => ($compact ? "9px 13px" : "11px 18px")};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.medium};
  font-weight: 700;
  font-size: 0.94rem;
  line-height: 1;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  ${({ $variant = "primary" }) => buttonVariants[$variant]}

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }
`;

export const IconButton = styled(Button)`
  width: 42px;
  min-height: 42px;
  padding: 0;
  border-radius: 13px;
`;

export const Field = styled.div`
  display: grid;
  gap: 8px;
`;

export const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.86rem;
  font-weight: 750;
`;

export const Input = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.medium};
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px rgba(45, 106, 82, 0.1);
    outline: none;
  }
`;

export const Select = styled.select`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.medium};
`;

export const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  color: ${({ theme, $tone }) =>
    $tone === "success" ? theme.colors.success : theme.colors.danger};
  background: ${({ theme, $tone }) =>
    $tone === "success" ? theme.colors.primarySoft : theme.colors.dangerSoft};
  border-radius: ${({ theme }) => theme.radius.medium};
  font-size: 0.9rem;
  line-height: 1.45;
`;

export const Badge = styled.span`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  color: ${({ theme, $tone }) =>
    $tone === "lilac"
      ? theme.colors.lilacText
      : $tone === "amber"
        ? theme.colors.amberText
        : theme.colors.primaryDark};
  background: ${({ theme, $tone }) =>
    $tone === "lilac"
      ? theme.colors.lilac
      : $tone === "amber"
        ? theme.colors.amber
        : theme.colors.primarySoft};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const MutedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSoft};
  line-height: 1.65;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Spinner = styled.span`
  width: ${({ $size = 18 }) => `${$size}px`};
  height: ${({ $size = 18 }) => `${$size}px`};
  display: inline-block;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`;

export const FullPageLoader = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.primary};
`;
