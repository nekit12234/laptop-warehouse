import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Склад ноутбуков</h1>
        <div className="app-user">
          <span className="app-user__name">
            {user?.full_name || user?.username}
          </span>
          <span className="app-user__role">{user?.role}</span>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Выход
          </button>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/" end className="app-nav__link">
          Дашборд
        </NavLink>
        <NavLink to="/laptops" className="app-nav__link">
          Склад
        </NavLink>
        <NavLink to="/suppliers" className="app-nav__link">
          Поставщики
        </NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}