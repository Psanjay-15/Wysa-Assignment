import {
  Activity,
  ArrowRight,
  BedDouble,
  Brain,
  Clock3,
  HeartPulse,
  Leaf,
  Play,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import api from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import { Alert, Badge, Button, Card, Spinner } from "../components/ui.js";
import getApiError from "../utils/api-error.js";

const modules = [
  {
    id: "daily-check-in",
    title: "Daily Check-in",
    description: "Begin with a simple mood check and route into the support you need.",
    icon: HeartPulse,
    tone: "#dceee5",
    iconColor: "#2d6a52",
    path: "Mood → tailored support",
  },
  {
    id: "stress-support",
    title: "Stress Support",
    description: "Explore stress intensity, switch modules, and exercise checkpoint resets.",
    icon: Brain,
    tone: "#eeeaf8",
    iconColor: "#66567f",
    path: "Stress → coping path",
  },
  {
    id: "sleep-support",
    title: "Sleep Support",
    description: "Test a sleep-focused path with same-module and breathing transitions.",
    icon: BedDouble,
    tone: "#e5edf7",
    iconColor: "#4d6680",
    path: "Sleep → calm routine",
  },
  {
    id: "breathing-exercise",
    title: "Breathing Exercise",
    description: "Start directly in a short exercise and test completion or stress routing.",
    icon: Leaf,
    tone: "#f7ead2",
    iconColor: "#855f26",
    path: "Breathe → reflect",
  },
];

const HeaderBlock = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;

  h1 {
    max-width: 720px;
    margin: 10px 0 12px;
    font-size: clamp(2.2rem, 5vw, 4rem);
    line-height: 1.04;
    letter-spacing: -0.055em;
  }

  p {
    max-width: 680px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textSoft};
    line-height: 1.7;
  }

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const FlowStatus = styled(Card)`
  min-width: 220px;
  padding: 18px;
  display: grid;
  gap: 12px;

  > div {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
  }

  strong {
    display: block;
    margin-top: 3px;
  }
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled(Card)`
  padding: clamp(22px, 4vw, 30px);
  display: grid;
  gap: 22px;
  box-shadow: none;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadow.medium};
  }
`;

const ModuleTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
`;

const ModuleIcon = styled.div`
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  color: ${({ $color }) => $color};
  background: ${({ $tone }) => $tone};
  border-radius: 17px;
`;

const ModuleCopy = styled.div`
  h2 {
    margin: 0 0 8px;
    font-size: 1.25rem;
    letter-spacing: -0.025em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.92rem;
    line-height: 1.65;
  }
`;

const Path = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 0.78rem;
  font-weight: 750;
`;

const RecentSection = styled.section`
  margin-top: 42px;

  h2 {
    margin: 0 0 16px;
    font-size: 1.3rem;
  }
`;

const RecentList = styled.div`
  display: grid;
  gap: 10px;
`;

const RecentRow = styled(Card)`
  padding: 15px 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  box-shadow: none;

  > div {
    min-width: 0;
  }

  strong,
  small {
    display: block;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const [starting, setStarting] = useState("");
  const [error, setError] = useState("");
  const [recent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wysa_recent_conversations")) || [];
    } catch {
      return [];
    }
  });

  const start = async (moduleId) => {
    setStarting(moduleId);
    setError("");

    try {
      const response = await api.post("/conversations/start", {
        flowId: "wellbeing-flow",
        moduleId,
      });
      const conversation = response.data.data;
      const nextRecent = [
        {
          id: conversation.conversationId,
          moduleId,
          createdAt: new Date().toISOString(),
        },
        ...recent.filter((item) => item.id !== conversation.conversationId),
      ].slice(0, 5);
      localStorage.setItem("wysa_recent_conversations", JSON.stringify(nextRecent));
      navigate(`/conversations/${conversation.conversationId}`, {
        state: { conversation },
      });
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setStarting("");
    }
  };

  return (
    <AppLayout>
      <HeaderBlock>
        <div>
          <Badge><Activity size={13} /> Live API workspace</Badge>
          <h1>Choose where the conversation begins.</h1>
          <p>
            Each module starts a new authenticated conversation. Routing is fully
            controlled by the backend, while the workspace shows every state change.
          </p>
        </div>
        <FlowStatus>
          <div>
            <Play size={17} />
            <span>Seeded flow<strong>wellbeing-flow</strong></span>
          </div>
          <div>
            <Activity size={17} />
            <span>Routing mode<strong>Deterministic</strong></span>
          </div>
        </FlowStatus>
      </HeaderBlock>

      {error && <Alert role="alert" style={{ marginBottom: 18 }}>{error}</Alert>}

      <ModuleGrid>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <ModuleCard key={module.id}>
              <ModuleTop>
                <ModuleIcon $tone={module.tone} $color={module.iconColor}>
                  <Icon size={25} />
                </ModuleIcon>
                <Badge $tone="lilac">Start module</Badge>
              </ModuleTop>
              <ModuleCopy>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </ModuleCopy>
              <Path><Clock3 size={14} /> {module.path}</Path>
              <Button
                type="button"
                $variant="secondary"
                disabled={Boolean(starting)}
                onClick={() => start(module.id)}
              >
                {starting === module.id ? <Spinner /> : <ArrowRight size={17} />}
                {starting === module.id ? "Starting…" : "Start conversation"}
              </Button>
            </ModuleCard>
          );
        })}
      </ModuleGrid>

      {recent.length > 0 && (
        <RecentSection>
          <h2>Recent on this device</h2>
          <RecentList>
            {recent.map((item) => (
              <RecentRow key={item.id}>
                <div>
                  <strong>{item.moduleId}</strong>
                  <small>{item.id}</small>
                </div>
                <Button
                  type="button"
                  $variant="ghost"
                  $compact
                  onClick={() => navigate(`/conversations/${item.id}`)}
                >
                  Resume <ArrowRight size={16} />
                </Button>
              </RecentRow>
            ))}
          </RecentList>
        </RecentSection>
      )}
    </AppLayout>
  );
};

export default DashboardPage;
