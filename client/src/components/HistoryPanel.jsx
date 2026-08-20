import {
  ArrowRightLeft,
  CheckCircle2,
  CircleDot,
  Flag,
  History,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import styled from "styled-components";
import { Badge, IconButton, Spinner } from "./ui.js";

const Overlay = styled.div`
  display: flex;
  justify-content: flex-end;
  background: rgba(19, 38, 31, 0.38);
  backdrop-filter: blur(4px);
  position: fixed;
  inset: 0;
  z-index: 50;
`;

const Drawer = styled.aside`
  width: min(100%, 480px);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: -20px 0 60px rgba(20, 47, 38, 0.16);
`;

const DrawerHeader = styled.header`
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 {
    margin: 4px 0 0;
    font-size: 1.35rem;
  }
`;

const Timeline = styled.div`
  padding: 24px;
  display: grid;
  gap: 0;
  overflow-y: auto;
`;

const Event = styled.article`
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 13px;
  position: relative;

  &:not(:last-child)::after {
    content: "";
    width: 1px;
    background: ${({ theme }) => theme.colors.border};
    position: absolute;
    left: 18px;
    top: 38px;
    bottom: 0;
  }
`;

const EventIcon = styled.div`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: ${({ theme, $accent }) =>
    $accent ? theme.colors.lilacText : theme.colors.primary};
  background: ${({ theme, $accent }) =>
    $accent ? theme.colors.lilac : theme.colors.primarySoft};
  border-radius: 12px;
  position: relative;
  z-index: 1;
`;

const EventBody = styled.div`
  padding: 1px 0 24px;

  strong {
    display: block;
    margin: 2px 0 6px;
    font-size: 0.92rem;
  }

  p,
  time {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.8rem;
    line-height: 1.55;
  }

  time {
    display: block;
    margin-top: 7px;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const Empty = styled.div`
  min-height: 260px;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.textSoft};
  text-align: center;
`;

const labels = {
  CONVERSATION_STARTED: ["Conversation started", Flag],
  ANSWER_ACCEPTED: ["Answer accepted", CheckCircle2],
  MODULE_TRANSITIONED: ["Module transitioned", ArrowRightLeft],
  CHECKPOINT_RESET: ["Checkpoint reset", RefreshCw],
  CONVERSATION_COMPLETED: ["Conversation completed", CircleDot],
  BACK_NAVIGATED: ["Moved back", RotateCcw],
};

const eventDescription = (event) => {
  if (event.eventType === "ANSWER_ACCEPTED") {
    return `${event.questionId} → ${event.optionId}`;
  }
  if (event.eventType === "MODULE_TRANSITIONED") {
    return `${event.fromModuleId} → ${event.toModuleId}`;
  }
  if (event.eventType === "CHECKPOINT_RESET") {
    return `${event.moduleId} began segment ${event.segmentNumber}`;
  }
  if (event.eventType === "CONVERSATION_COMPLETED") {
    return `Completed from ${event.moduleId}`;
  }
  return `${event.toModuleId || event.moduleId} · ${event.toQuestionId || event.questionId}`;
};

const HistoryPanel = ({ open, events, loading, onClose }) => {
  if (!open) return null;

  return (
    <Overlay role="presentation" onMouseDown={onClose}>
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <DrawerHeader>
          <div>
            <Badge><History size={13} /> Permanent record</Badge>
            <h2 id="history-title">Conversation history</h2>
          </div>
          <IconButton type="button" $variant="ghost" aria-label="Close history" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </DrawerHeader>
        {loading ? (
          <Empty><Spinner $size={26} /></Empty>
        ) : events.length === 0 ? (
          <Empty>No history events are available.</Empty>
        ) : (
          <Timeline>
            {events.map((event) => {
              const [label, Icon] = labels[event.eventType] || [event.eventType, CircleDot];
              return (
                <Event key={`${event.stateVersion}-${event.eventOrder}`}>
                  <EventIcon $accent={event.eventType === "MODULE_TRANSITIONED"}>
                    <Icon size={17} />
                  </EventIcon>
                  <EventBody>
                    <Badge $tone="lilac">v{event.stateVersion}.{event.eventOrder}</Badge>
                    <strong>{label}</strong>
                    <p>{eventDescription(event)}</p>
                    <time>{new Date(event.createdAt).toLocaleString()}</time>
                  </EventBody>
                </Event>
              );
            })}
          </Timeline>
        )}
      </Drawer>
    </Overlay>
  );
};

export default HistoryPanel;
