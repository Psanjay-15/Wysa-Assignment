import { CheckCircle2, Link2, Search, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/client.js";
import getApiError from "../utils/api-error.js";
import { Alert, Badge, Button, Card, Field, IconButton, Input, Label, Spinner } from "./ui.js";

const Overlay = styled.div`
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(19, 38, 31, 0.42);
  backdrop-filter: blur(5px);
  position: fixed;
  inset: 0;
  z-index: 55;
`;

const Modal = styled(Card)`
  width: min(100%, 620px);
  max-height: calc(100vh - 40px);
  padding: clamp(22px, 4vw, 34px);
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;

  h2 {
    margin: 9px 0 6px;
    font-size: 1.55rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSoft};
    line-height: 1.55;
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;

  > button,
  > div[role="alert"] {
    grid-column: 1 / -1;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;

    > button,
    > div[role="alert"] {
      grid-column: auto;
    }
  }
`;

const Result = styled(Card)`
  margin-top: 18px;
  padding: 18px;
  display: grid;
  gap: 13px;
  background: ${({ theme, $stale }) =>
    $stale ? theme.colors.amber : theme.colors.primarySoft};
  border-color: transparent;
  box-shadow: none;

  h3,
  p {
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.88rem;
    line-height: 1.55;
  }
`;

const DeepLinkPanel = ({
  open,
  conversationId,
  currentModuleId,
  currentQuestionId,
  onClose,
}) => {
  const [form, setForm] = useState({ moduleId: "", questionId: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        moduleId: currentModuleId || "",
        questionId: currentQuestionId || "",
      });
      setResult(null);
      setError("");
    }
  }, [open, currentModuleId, currentQuestionId]);

  if (!open) return null;

  const testLink = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.get(
        `/conversations/${conversationId}/modules/${encodeURIComponent(form.moduleId)}/questions/${encodeURIComponent(form.questionId)}`,
      );
      setResult(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay role="presentation" onMouseDown={onClose}>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="deep-link-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ModalHeader>
          <div>
            <Badge $tone="lilac"><Link2 size={13} /> Deep-link lab</Badge>
            <h2 id="deep-link-title">Test a question link</h2>
            <p>Try the current IDs or enter an older question to verify stale-link recovery.</p>
          </div>
          <IconButton type="button" $variant="ghost" aria-label="Close deep-link tester" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </ModalHeader>
        <Form onSubmit={testLink}>
          {error && <Alert role="alert">{error}</Alert>}
          <Field>
            <Label htmlFor="deep-module">Module ID</Label>
            <Input
              id="deep-module"
              value={form.moduleId}
              onChange={(event) =>
                setForm((current) => ({ ...current, moduleId: event.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <Label htmlFor="deep-question">Question ID</Label>
            <Input
              id="deep-question"
              value={form.questionId}
              onChange={(event) =>
                setForm((current) => ({ ...current, questionId: event.target.value }))
              }
              required
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner /> : <Search size={17} />}
            {loading ? "Checking link…" : "Resolve deep link"}
          </Button>
        </Form>
        {result && (
          <Result $stale={result.stale}>
            <Badge $tone={result.stale ? "amber" : undefined}>
              {result.stale ? <TriangleAlert size={13} /> : <CheckCircle2 size={13} />}
              {result.stale ? "Stale link recovered" : "Exact active link"}
            </Badge>
            <h3>{result.question?.text || "Conversation completed"}</h3>
            <p>
              Canonical state: {result.currentModuleId || "completed"} · {result.question?.questionId || "no active question"} · version {result.stateVersion}
            </p>
          </Result>
        )}
      </Modal>
    </Overlay>
  );
};

export default DeepLinkPanel;
