import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ConversationPage from "./pages/ConversationPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/app" replace />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/app" element={protect(<DashboardPage />)} />
    <Route
      path="/conversations/:conversationId"
      element={protect(<ConversationPage />)}
    />
    <Route path="*" element={protect(<NotFoundPage />)} />
  </Routes>
);

export default App;
