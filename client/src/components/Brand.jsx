import { Sparkles } from "lucide-react";
import styled from "styled-components";

const BrandWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 11px;
`;

const Mark = styled.span`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #fff;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 13px 13px 13px 5px;
  box-shadow: 0 8px 20px rgba(45, 106, 82, 0.2);
`;

const Wordmark = styled.span`
  display: grid;
  gap: 1px;

  strong {
    color: ${({ theme, $light }) => ($light ? "#fff" : theme.colors.text)};
    font-size: 1rem;
    letter-spacing: -0.02em;
  }

  small {
    color: ${({ theme, $light }) =>
      $light ? "rgba(255,255,255,.68)" : theme.colors.textSoft};
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
`;

const Brand = ({ light = false }) => (
  <BrandWrap aria-label="Wysa Flow Lab">
    <Mark>
      <Sparkles size={18} aria-hidden="true" />
    </Mark>
    <Wordmark $light={light}>
      <strong>Wysa Flow Lab</strong>
      <small>Conversation workspace</small>
    </Wordmark>
  </BrandWrap>
);

export default Brand;
