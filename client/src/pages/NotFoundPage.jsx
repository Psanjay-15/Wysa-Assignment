import { ArrowLeft, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AppLayout from "../components/AppLayout.jsx";
import { Button, Card, MutedText } from "../components/ui.js";

const Surface = styled(Card)`
  min-height: 520px;
  padding: 32px;
  display: grid;
  place-items: center;
  text-align: center;

  h1 {
    margin: 18px 0 10px;
    font-size: 2.4rem;
    letter-spacing: -0.05em;
  }
`;

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <Surface>
        <div>
          <SearchX size={42} />
          <h1>That page is not in this flow.</h1>
          <MutedText>Return to the module launcher and start from a valid route.</MutedText>
          <Button type="button" style={{ marginTop: 24 }} onClick={() => navigate("/app")}>
            <ArrowLeft size={17} /> Back to launcher
          </Button>
        </div>
      </Surface>
    </AppLayout>
  );
};

export default NotFoundPage;
