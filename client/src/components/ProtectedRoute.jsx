import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FullPageLoader, Spinner } from "./ui.js";

const ProtectedRoute = ({ children }) => {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <FullPageLoader aria-label="Restoring your session">
        <Spinner $size={26} />
      </FullPageLoader>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
