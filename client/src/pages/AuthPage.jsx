import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Brand from "../components/Brand.jsx";
import { Alert, Button, Card, Field, Input, Label, Spinner } from "../components/ui.js";
import { useAuth } from "../context/AuthContext.jsx";
import getApiError from "../utils/api-error.js";

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(380px, 0.9fr) minmax(480px, 1.1fr);
  background: ${({ theme }) => theme.colors.backgroundWarm};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StoryPanel = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(34px, 5vw, 72px);
  color: #fff;
  background:
    radial-gradient(circle at 85% 15%, rgba(181, 222, 199, 0.25), transparent 28%),
    radial-gradient(circle at 10% 85%, rgba(238, 234, 248, 0.18), transparent 28%),
    #173f32;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    width: 340px;
    height: 340px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 50%;
    position: absolute;
    right: -170px;
    bottom: 8%;
  }

  @media (max-width: 900px) {
    min-height: auto;
    gap: 48px;
  }
`;

const Story = styled.div`
  max-width: 570px;
  position: relative;
  z-index: 1;

  h1 {
    max-width: 560px;
    margin: 0 0 20px;
    font-size: clamp(2.35rem, 5vw, 4.5rem);
    line-height: 1.03;
    letter-spacing: -0.055em;
  }

  p {
    max-width: 520px;
    margin: 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 1.02rem;
    line-height: 1.75;
  }
`;

const PromiseList = styled.div`
  display: grid;
  gap: 13px;
  margin-top: 34px;
`;

const Promise = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.9rem;
  font-weight: 650;
`;

const FormSide = styled.section`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 42px 20px 64px;
  }
`;

const FormCard = styled(Card)`
  width: min(100%, 480px);
  padding: clamp(28px, 4vw, 44px);

  h2 {
    margin: 14px 0 8px;
    font-size: 2rem;
    letter-spacing: -0.04em;
  }

  > p {
    margin: 0 0 28px;
    color: ${({ theme }) => theme.colors.textSoft};
    line-height: 1.6;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 18px;
`;

const FormFooter = styled.p`
  margin: 24px 0 0 !important;
  text-align: center;
  font-size: 0.9rem;

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 800;
    text-decoration: none;
  }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 0.78rem;
`;

const AuthPage = ({ mode }) => {
  const isRegister = mode === "register";
  const { user, isReady, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isReady && user) {
    return <Navigate to="/app" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await (isRegister ? register(form) : login(form));
      navigate(location.state?.from || "/app", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <StoryPanel>
        <Brand light />
        <Story>
          <h1>Test every path with calm confidence.</h1>
          <p>
            A focused workspace for exploring deterministic conversation flows,
            validating transitions, and inspecting permanent history in real time.
          </p>
          <PromiseList>
            <Promise><CheckCircle2 size={18} /> Server-controlled routing</Promise>
            <Promise><CheckCircle2 size={18} /> Live state and version visibility</Promise>
            <Promise><CheckCircle2 size={18} /> Safe stale-link testing</Promise>
          </PromiseList>
        </Story>
        <Promise>
          <ShieldCheck size={18} /> Built for the Wysa backend assignment
        </Promise>
      </StoryPanel>
      <FormSide>
        <FormCard $elevated>
          <LockKeyhole size={24} />
          <h2>{isRegister ? "Create your workspace" : "Welcome back"}</h2>
          <p>
            {isRegister
              ? "Use an email and password to begin testing the conversation flow."
              : "Sign in to continue your conversation testing session."}
          </p>
          <Form onSubmit={submit}>
            {error && <Alert role="alert">{error}</Alert>}
            <Field>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner /> : <ArrowRight size={18} />}
              {submitting
                ? isRegister
                  ? "Creating account…"
                  : "Signing in…"
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </Form>
          <FormFooter>
            {isRegister ? "Already have an account? " : "New to Flow Lab? "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </FormFooter>
          <SecurityNote>
            <ShieldCheck size={14} /> Your password is securely hashed by the API.
          </SecurityNote>
        </FormCard>
      </FormSide>
    </Page>
  );
};

export default AuthPage;
