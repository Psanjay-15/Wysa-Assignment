import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Code2,
  History,
  Link2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import api from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import DeepLinkPanel from "../components/DeepLinkPanel.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import QuestionCard from "../components/QuestionCard.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  IconButton,
  MutedText,
  Spinner,
} from "../components/ui.js";
import getApiError from "../utils/api-error.js";

const moduleNames = {
  "daily-check-in": "Daily Check-in",
  "stress-support": "Stress Support",
  "sleep-support": "Sleep Support",
  "breathing-exercise": "Breathing Exercise",
};

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h1 {
    margin: 4px 0 0;
    font-size: 1.35rem;
    letter-spacing: -0.025em;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 22px;
  align-items: start;

  @media (max-width: 940px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 16px;
`;

const StateRail = styled.aside`
  display: grid;
  gap: 14px;
  position: sticky;
  top: 98px;

  @media (max-width: 940px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    position: static;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StateCard = styled(Card)`
  padding: 20px;
  box-shadow: none;

  h2 {
    margin: 0 0 16px;
    font-size: 1rem;
  }
`;

const StateRows = styled.dl`
  display: grid;
  gap: 13px;
  margin: 0;

  div {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  dt {
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.78rem;
  }

  dd {
    max-width: 170px;
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    text-align: right;
    overflow-wrap: anywhere;
  }
`;

const SafetyCard = styled(Card)`
  padding: 20px;
  display: grid;
  gap: 13px;
  color: ${({ theme }) => theme.colors.primaryDark};
  background: ${({ theme }) => theme.colors.primarySoft};
  border-color: transparent;
  box-shadow: none;

  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: 0.95rem;
  }

  p {
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.8rem;
    line-height: 1.55;
  }
`;

const LoadingCard = styled(Card)`
  min-height: 430px;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.primary};
`;

const CompletionCard = styled(Card)`
  min-height: 460px;
  padding: clamp(30px, 7vw, 64px);
  display: grid;
  place-items: center;
  text-align: center;
  background:
    radial-gradient(
      circle at 50% 25%,
      rgba(220, 238, 229, 0.9),
      transparent 36%
    ),
    ${({ theme }) => theme.colors.surface};

  > div {
    max-width: 560px;
  }

  h1 {
    margin: 18px 0 12px;
    font-size: clamp(2.15rem, 5vw, 3.5rem);
    letter-spacing: -0.055em;
  }

  p {
    margin: 0 0 26px;
    color: ${({ theme }) => theme.colors.textSoft};
    line-height: 1.7;
  }
`;

const CompletionIcon = styled.div`
  width: 72px;
  height: 72px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  color: #fff;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 24px;
  box-shadow: 0 16px 30px rgba(45, 106, 82, 0.23);
`;

const CompletionActions = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const EmptyCard = styled(Card)`
  min-height: 380px;
  padding: 32px;
  display: grid;
  place-items: center;
  text-align: center;

  h2 {
    margin: 0 0 10px;
  }
`;

const normalizeConversation = (data, previousModuleId = "") => ({
  conversationId: data.conversationId,
  status: data.status,
  stateVersion: data.stateVersion,
  moduleId: data.moduleId || data.currentModuleId || previousModuleId,
  canGoBack: Boolean(data.canGoBack),
  previousOptionId: data.previousOptionId || null,
  question: data.question,
});

const ConversationPage = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(() =>
    location.state?.conversation
      ? normalizeConversation(location.state.conversation)
      : null,
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(!location.state?.conversation);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selecting, setSelecting] = useState("");
  const [backing, setBacking] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deepLinkOpen, setDeepLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get(
        `/conversations/${conversationId}/history`,
      );
      setEvents(response.data.data.events);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setHistoryLoading(false);
    }
  }, [conversationId]);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/conversations/${conversationId}/current`,
      );
      setConversation((current) =>
        normalizeConversation(response.data.data, current?.moduleId),
      );
    } catch (requestError) {
      setError(getApiError(requestError));
      setConversation(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadCurrent();
    loadHistory();
  }, [loadCurrent, loadHistory]);

  const submitAnswer = async (optionId) => {
    if (!conversation?.question) return;
    setSelecting(optionId);
    setError("");

    try {
      const response = await api.post(
        `/conversations/${conversationId}/answers`,
        {
          questionId: conversation.question.questionId,
          optionId,
          expectedStateVersion: conversation.stateVersion,
        },
      );
      setConversation((current) =>
        normalizeConversation(response.data.data, current?.moduleId),
      );
      await loadHistory();
    } catch (requestError) {
      setError(getApiError(requestError));
      if (requestError.response?.status === 409) {
        await loadCurrent();
        await loadHistory();
      }
    } finally {
      setSelecting("");
    }
  };

  const goBack = async () => {
    if (!conversation?.question || !conversation.canGoBack) return;

    setBacking(true);
    setError("");

    try {
      const response = await api.post(
        `/conversations/${conversationId}/back`,
        { expectedStateVersion: conversation.stateVersion },
      );
      setConversation((current) =>
        normalizeConversation(response.data.data, current?.moduleId),
      );
      await loadHistory();
    } catch (requestError) {
      setError(getApiError(requestError));
      if (requestError.response?.status === 409) {
        await loadCurrent();
        await loadHistory();
      }
    } finally {
      setBacking(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(conversationId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError(
        "Could not copy automatically. Select the conversation ID from the URL.",
      );
    }
  };

  if (loading && !conversation) {
    return (
      <AppLayout>
        <LoadingCard>
          <Spinner $size={28} />
        </LoadingCard>
      </AppLayout>
    );
  }

  if (!conversation) {
    return (
      <AppLayout>
        <EmptyCard>
          <div>
            <h2>Conversation unavailable</h2>
            <MutedText>
              {error || "This conversation could not be loaded."}
            </MutedText>
            <Button
              type="button"
              style={{ marginTop: 20 }}
              onClick={() => navigate("/app")}
            >
              Return to launcher
            </Button>
          </div>
        </EmptyCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header>
        <Breadcrumb>
          <IconButton
            type="button"
            $variant="secondary"
            aria-label="Back to launcher"
            onClick={() => navigate("/app")}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <div>
            <Badge>{conversation.status}</Badge>
            <h1>
              {moduleNames[conversation.moduleId] || conversation.moduleId}
            </h1>
          </div>
        </Breadcrumb>
        <HeaderActions>
          <Button
            type="button"
            $variant="secondary"
            $compact
            onClick={loadCurrent}
            disabled={loading}
          >
            {loading ? <Spinner /> : <RefreshCw size={16} />} Refresh
          </Button>
          <Button
            type="button"
            $variant="secondary"
            $compact
            onClick={() => setDeepLinkOpen(true)}
            disabled={!conversation.question}
          >
            <Link2 size={16} /> Test deep link
          </Button>
          <Button
            type="button"
            $variant="secondary"
            $compact
            onClick={() => {
              setHistoryOpen(true);
              loadHistory();
            }}
          >
            <History size={16} /> History
          </Button>
        </HeaderActions>
      </Header>

      {error && (
        <Alert role="alert" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}

      <Workspace>
        <MainColumn>
          {conversation.status === "completed" ? (
            <CompletionCard $elevated>
              <div>
                <CompletionIcon>
                  <CheckCircle2 size={34} />
                </CompletionIcon>
                <h1>Flow completed.</h1>
                <p>
                  The final answer is safely stored in permanent history. Start
                  another module or inspect the event timeline for this
                  conversation.
                </p>
                <CompletionActions>
                  <Button type="button" onClick={() => navigate("/app")}>
                    <RotateCcw size={17} /> Start another flow
                  </Button>
                  <Button
                    type="button"
                    $variant="secondary"
                    onClick={() => {
                      setHistoryOpen(true);
                      loadHistory();
                    }}
                  >
                    <History size={17} /> View history
                  </Button>
                </CompletionActions>
              </div>
            </CompletionCard>
          ) : (
            <QuestionCard
              question={conversation.question}
              stateVersion={conversation.stateVersion}
              selecting={selecting}
              selectedOptionId={conversation.previousOptionId}
              canGoBack={conversation.canGoBack}
              backing={backing}
              onSelect={submitAnswer}
              onBack={goBack}
            />
          )}
        </MainColumn>

        <StateRail>
          <StateCard>
            <h2>Live state snapshot</h2>
            <StateRows>
              <div>
                <dt>Status</dt>
                <dd>{conversation.status}</dd>
              </div>
              <div>
                <dt>State version</dt>
                <dd>v{conversation.stateVersion}</dd>
              </div>
              <div>
                <dt>Module</dt>
                <dd>{conversation.moduleId || "—"}</dd>
              </div>
              <div>
                <dt>Question</dt>
                <dd>{conversation.question?.questionId || "Complete"}</dd>
              </div>
              <div>
                <dt>History events</dt>
                <dd>{events.length}</dd>
              </div>
            </StateRows>
            <Divider style={{ margin: "17px 0" }} />
            <Button type="button" $variant="ghost" $compact onClick={copyId}>
              <Clipboard size={15} />{" "}
              {copied ? "Copied" : "Copy conversation ID"}
            </Button>
          </StateCard>
        </StateRail>
      </Workspace>

      <HistoryPanel
        open={historyOpen}
        events={events}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
      />
      <DeepLinkPanel
        open={deepLinkOpen}
        conversationId={conversationId}
        currentModuleId={conversation.moduleId}
        currentQuestionId={conversation.question?.questionId}
        onClose={() => setDeepLinkOpen(false)}
      />
    </AppLayout>
  );
};

export default ConversationPage;
