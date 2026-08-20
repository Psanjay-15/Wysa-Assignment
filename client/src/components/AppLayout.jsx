import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import Brand from "./Brand.jsx";
import { Button, IconButton } from "./ui.js";

const Shell = styled.div`
  min-height: 100vh;
`;

const Header = styled.header`
  height: 76px;
  display: flex;
  align-items: center;
  background: rgba(244, 247, 243, 0.91);
  border-bottom: 1px solid rgba(198, 212, 204, 0.78);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 20;
`;

const HeaderInner = styled.div`
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 640px) {
    width: min(100% - 28px, 1180px);
  }
`;

const BrandLink = styled(Link)`
  color: inherit;
  text-decoration: none;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 760px) {
    display: ${({ $open }) => ($open ? "grid" : "none")};
    width: calc(100% - 28px);
    padding: 16px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.large};
    box-shadow: ${({ theme }) => theme.shadow.medium};
    position: absolute;
    top: 68px;
    left: 14px;
  }
`;

const NavLink = styled(Link)`
  padding: 10px 13px;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primaryDark : theme.colors.textSoft};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primarySoft : "transparent"};
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 750;
  text-decoration: none;
`;

const UserBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 10px;
  border-left: 1px solid ${({ theme }) => theme.colors.border};

  span {
    max-width: 180px;
    color: ${({ theme }) => theme.colors.textSoft};
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    padding: 12px 0 0;
    border-left: 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    justify-content: space-between;
  }
`;

const MobileToggle = styled(IconButton)`
  display: none;

  @media (max-width: 760px) {
    display: inline-flex;
  }
`;

const Main = styled.main`
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 42px 0 64px;

  @media (max-width: 640px) {
    width: min(100% - 28px, 1180px);
    padding-top: 28px;
  }
`;

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <Shell>
      <Header>
        <HeaderInner>
          <BrandLink to="/app" aria-label="Go to module launcher">
            <Brand />
          </BrandLink>
          <MobileToggle
            type="button"
            $variant="secondary"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </MobileToggle>
          <Navigation $open={menuOpen} aria-label="Main navigation">
            <NavLink
              to="/app"
              $active={location.pathname === "/app"}
              onClick={() => setMenuOpen(false)}
            >
              Module launcher
            </NavLink>
            <UserBlock>
              <span title={user?.email}>{user?.email}</span>
              <Button type="button" $variant="ghost" $compact onClick={signOut}>
                <LogOut size={16} />
                Sign out
              </Button>
            </UserBlock>
          </Navigation>
        </HeaderInner>
      </Header>
      <Main>{children}</Main>
    </Shell>
  );
};

export default AppLayout;
