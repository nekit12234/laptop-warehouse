import { useEffect, useState } from "react";
import { SuppliersAPI } from "../api";
import "./Suppliers.css";

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
  });
  const [showForm, setShowForm] = useState(false);

  const load = () => SuppliersAPI.list().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await SuppliersAPI.create(form);
      setForm({ name: "", contact_person: "", phone: "", email: "" });
      setShowForm(false);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Ошибка");
    }
  };

  return (
    <div>
      <button className="btn" onClick={() => setShowForm(!showForm)}>
        + Добавить поставщика
      </button>

      {showForm && (
        <form
          className="form-card"
          onSubmit={submit}
          style={{ marginTop: 12 }}
        >
          <div className="form-grid">
            <label className="form-label">
              Название
              <input
                className="input"
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="form-label">
              Контактное лицо
              <input
                className="input"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
              />
            </label>
            <label className="form-label">
              Телефон
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="form-label">
              Email
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              Сохранить
            </button>
          </div>
        </form>
      )}

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Контакт</th>
            <th>Телефон</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td>
                <b>{s.name}</b>
              </td>
              <td>{s.contact_person || "—"}</td>
              <td>{s.phone || "—"}</td>
              <td>{s.email || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}