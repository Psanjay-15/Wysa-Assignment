import {
  ArrowRight,
  Check,
  CornerUpLeft,
  Flag,
  RefreshCw,
} from "lucide-react";
import styled from "styled-components";
import { Badge, Button, Card, Spinner } from "./ui.js";

const QuestionSurface = styled(Card)`
  padding: clamp(24px, 5vw, 44px);
  overflow: hidden;
  position: relative;

  &::before {
    content: "";
    width: 180px;
    height: 180px;
    background: ${({ theme }) => theme.colors.primarySoft};
    border-radius: 50%;
    filter: blur(2px);
    opacity: 0.45;
    position: absolute;
    right: -95px;
    top: -105px;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 28px;
  position: relative;
`;

const QuestionId = styled.code`
  color: ${({ theme }) => theme.colors.textFaint};
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
`;

const QuestionText = styled.h1`
  max-width: 760px;
  margin: 0 0 32px;
  font-size: clamp(1.9rem, 4.5vw, 3.35rem);
  line-height: 1.12;
  letter-spacing: -0.05em;
  position: relative;
`;

const Hint = styled.p`
  margin: -18px 0 24px;
  color: ${({ theme }) => theme.colors.textSoft};
  font-size: 0.9rem;
`;

const Options = styled.div`
  display: grid;
  gap: 12px;
  position: relative;
`;

const QuestionActions = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textFaint};
    font-size: 0.78rem;
    text-align: right;
  }

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;

    p {
      text-align: left;
    }
  }
`;

const Option = styled.button`
  width: 100%;
  min-height: 64px;
  display: grid;
  grid-template-columns: 36px 1fr 24px;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme, $loading, $selected }) =>
    $loading || $selected ? theme.colors.primarySoft : theme.colors.surface};
  border: 1px solid
    ${({ theme, $loading, $selected }) =>
      $loading || $selected
        ? theme.colors.primary
        : theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.medium};
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateX(3px);
  }

  &:disabled {
    cursor: wait;
    opacity: ${({ $loading }) => ($loading ? 1 : 0.52)};
  }

  strong {
    font-size: 0.98rem;
  }
`;

const OptionMark = styled.span`
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: ${({ theme, $selected }) =>
    $selected ? "#fff" : theme.colors.primary};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary : theme.colors.primarySoft};
  border-radius: 11px;
`;

const QuestionCard = ({
  question,
  stateVersion,
  selecting,
  selectedOptionId,
  canGoBack,
  backing,
  onSelect,
  onBack,
}) => (
  <QuestionSurface $elevated>
    <QuestionHeader>
      <Badge $tone={question.isCheckpoint ? "amber" : undefined}>
        {question.isCheckpoint ? <RefreshCw size={13} /> : <Flag size={13} />}
        {question.isCheckpoint ? "Checkpoint" : `State ${stateVersion}`}
      </Badge>
      <QuestionId>{question.questionId}</QuestionId>
    </QuestionHeader>
    <QuestionText>{question.text}</QuestionText>
    <Hint>Select one response. The API decides where the flow goes next.</Hint>
    <Options>
      {question.options.map((option) => {
        const loading = selecting === option.optionId;
        const selected = selectedOptionId === option.optionId;
        return (
          <Option
            key={option.optionId}
            type="button"
            $loading={loading}
            $selected={selected}
            aria-pressed={selected}
            disabled={Boolean(selecting) || backing}
            onClick={() => onSelect(option.optionId)}
          >
            <OptionMark $selected={selected}>
              {loading ? <Spinner $size={17} /> : <Check size={17} />}
            </OptionMark>
            <strong>{option.text}</strong>
            {!loading && <ArrowRight size={18} />}
          </Option>
        );
      })}
    </Options>
    <QuestionActions>
      <Button
        type="button"
        $variant="secondary"
        onClick={onBack}
        disabled={!canGoBack || Boolean(selecting) || backing}
      >
        {backing ? <Spinner $size={16} /> : <CornerUpLeft size={17} />}
        Previous question
      </Button>
      <p>
        Back navigation stays inside the current module and checkpoint segment.
      </p>
    </QuestionActions>
  </QuestionSurface>
);

export default QuestionCard;
