import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.detail || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h2 className="login-title">Вход в систему</h2>

        <label className="login-label">
          Логин
          <input
            className="input"
            value={form.username}
            autoFocus
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>

        <label className="login-label">
          Пароль
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <button className="btn login-btn" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>

        {err && <p className="error">{err}</p>}

        <p className="login-hint">
          Демо-доступы:
          <br />
          <code>admin / admin123</code> — полный доступ
          <br />
          <code>manager / manager123</code> — без удаления
          <br />
          <code>viewer / viewer123</code> — только просмотр
        </p>
      </form>
    </div>
  );
}