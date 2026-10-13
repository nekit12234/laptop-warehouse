import { useEffect, useState } from "react";
import { LaptopsAPI, OperationsAPI, SuppliersAPI } from "../api";
import "./Laptops.css";

export default function Laptops() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [showBulk, setShowBulk] = useState(false);

  const load = () => {
    LaptopsAPI.list({ search: search || undefined }).then(setItems);
    SuppliersAPI.list().then(setSuppliers);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const doOperation = async (laptop, type) => {
    const qty = Number(prompt(type === "income" ? "Приход:" : "Расход:"));
    if (!qty) return;
    try {
      await OperationsAPI.create({ laptop_id: laptop.id, type, quantity: qty });
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Ошибка");
    }
  };

  const showHistory = async (laptop) => {
    const ops = await OperationsAPI.list({ laptop_id: laptop.id, limit: 30 });
    setHistory({ laptop, ops });
  };

  const toggleDelivered = async (op) => {
    const newValue = !op.delivered;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/operations/${op.id}/delivered?delivered=${newValue}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Ошибка");
        return;
      }
      await showHistory(history.laptop);
      load();
    } catch (e) {
      alert("Ошибка: " + e.message);
    }
  };

  return (
    <div>
      <div className="laptops__toolbar">
        <input
          className="input laptops__search"
          placeholder="Поиск по бренду, модели, SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Добавить
        </button>
        <button className="btn btn-secondary" onClick={() => setShowBulk(true)}>
          📦 Массовая операция
        </button>
      </div>

      {showBulk && (
        <BulkOperationForm
          laptops={items}
          onSaved={() => {
            setShowBulk(false);
            load();
          }}
          onCancel={() => setShowBulk(false)}
        />
      )}

      {showForm && (
        <LaptopForm
          initial={editing}
          suppliers={suppliers}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {history && (
        <div className="laptops__history">
          <div className="laptops__history-head">
            <b>
              История: {history.laptop.brand} {history.laptop.model}
            </b>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setHistory(null)}
            >
              Закрыть
            </button>
          </div>
          <ul>
            {history.ops.map((op) => (
              <li key={op.id}>
                <span className="muted">
                  {new Date(op.created_at).toLocaleString("ru-RU")}
                </span>
                <b>{op.type}</b>
                <span>— {op.quantity} шт.</span>
                {op.comment && (
                  <span className="muted">({op.comment})</span>
                )}

                {(op.type === "outcome" || op.type === "write_off") && (
                  <span className="op-status-block">
                    {op.delivered ? (
                      <>
                        <span className="op-delivered">✔ Доставлено</span>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => toggleDelivered(op)}
                        >
                          Отменить
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="op-pending">⏳ В пути</span>
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => toggleDelivered(op)}
                        >
                          Отметить доставленным
                        </button>
                      </>
                    )}
                  </span>
                )}
              </li>
            ))}
            {history.ops.length === 0 && <li className="muted">Операций нет</li>}
          </ul>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Бренд / модель</th>
            <th>Конфиг</th>
            <th>Закупка</th>
            <th>Продажа</th>
            <th>Остаток</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <td>
                <code>{l.sku}</code>
              </td>
              <td>
                {l.brand} <b>{l.model}</b>
              </td>
              <td className="table__num">
                {l.cpu} / {l.ram_gb}GB / {l.storage_gb}GB
              </td>
              <td className="table__num">
                {l.purchase_price.toLocaleString("ru-RU")} ₽
              </td>
              <td className="table__num">
                {l.sale_price.toLocaleString("ru-RU")} ₽
              </td>
              <td
                className={
                  "table__num " +
                  (l.quantity <= l.min_quantity ? "table__num--danger" : "")
                }
              >
                {l.quantity}
              </td>
              <td>
                <div className="table__actions">
                  <button
                    className="btn btn-small"
                    onClick={() => doOperation(l, "income")}
                  >
                    + Приход
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => doOperation(l, "outcome")}
                  >
                    − Расход
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => showHistory(l)}
                  >
                    История
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => {
                      setEditing(l);
                      setShowForm(true);
                    }}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={async () => {
                      if (window.confirm("Удалить ноутбук?")) {
                        await LaptopsAPI.remove(l.id);
                        load();
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          Ничего не найдено.
        </p>
      )}
    </div>
  );
}

/* ================== Форма одного ноутбука ================== */
function LaptopForm({ initial, suppliers, onSaved, onCancel }) {
  const [f, setF] = useState({
    brand: initial?.brand || "",
    model: initial?.model || "",
    cpu: initial?.cpu || "",
    ram_gb: initial?.ram_gb || 8,
    storage_gb: initial?.storage_gb || 256,
    os: initial?.os || "",
    purchase_price: initial?.purchase_price || 0,
    sale_price: initial?.sale_price || 0,
    quantity: initial?.quantity || 0,
    min_quantity: initial?.min_quantity || 3,
    supplier_id: initial?.supplier_id || (suppliers[0]?.id ?? ""),
  });

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...f,
      ram_gb: +f.ram_gb,
      storage_gb: +f.storage_gb,
      purchase_price: +f.purchase_price,
      sale_price: +f.sale_price,
      quantity: +f.quantity,
      min_quantity: +f.min_quantity,
      supplier_id: f.supplier_id ? +f.supplier_id : null,
    };
    try {
      if (initial?.id) await LaptopsAPI.update(initial.id, payload);
      else await LaptopsAPI.create(payload);
      onSaved();
    } catch (e) {
      alert(JSON.stringify(e.response?.data));
    }
  };

  return (
    <form className="form-card" onSubmit={submit}>
      <h3>{initial?.id ? "Редактирование ноутбука" : "Новый ноутбук"}</h3>
      <div className="form-grid">
        <label className="form-label">
          Бренд
          <input className="input" value={f.brand} onChange={set("brand")} required />
        </label>
        <label className="form-label">
          Модель
          <input className="input" value={f.model} onChange={set("model")} required />
        </label>
        <label className="form-label">
          CPU
          <input className="input" value={f.cpu} onChange={set("cpu")} />
        </label>
        <label className="form-label">
          RAM, GB
          <input className="input" type="number" value={f.ram_gb} onChange={set("ram_gb")} />
        </label>
        <label className="form-label">
          SSD, GB
          <input className="input" type="number" value={f.storage_gb} onChange={set("storage_gb")} />
        </label>
        <label className="form-label">
          ОС
          <input className="input" value={f.os} onChange={set("os")} />
        </label>
        <label className="form-label">
          Закупочная цена, ₽
          <input className="input" type="number" value={f.purchase_price} onChange={set("purchase_price")} required />
        </label>
        <label className="form-label">
          Цена продажи, ₽
          <input className="input" type="number" value={f.sale_price} onChange={set("sale_price")} required />
        </label>
        <label className="form-label">
          Количество
          <input className="input" type="number" value={f.quantity} onChange={set("quantity")} />
        </label>
        <label className="form-label">
          Мин. остаток
          <input className="input" type="number" value={f.min_quantity} onChange={set("min_quantity")} />
        </label>
        <label className="form-label">
          Поставщик
          <select className="input" value={f.supplier_id} onChange={set("supplier_id")}>
            <option value="">— не выбран —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button className="btn" type="submit">Сохранить</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

/* ================== Массовая операция ================== */
function BulkOperationForm({ laptops, onSaved, onCancel }) {
  const [type, setType] = useState("income");
  const [comment, setComment] = useState("");
  const [rows, setRows] = useState([{ laptop_id: "", quantity: 1 }]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const addRow = () => setRows([...rows, { laptop_id: "", quantity: 1 }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, key, value) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const errs = [];
    const cleaned = [];
    rows.forEach((r, i) => {
      if (!r.laptop_id) {
        errs.push(`Строка ${i + 1}: не выбран ноутбук`);
        return;
      }
      const qty = Number(r.quantity);
      if (!qty || qty <= 0) {
        errs.push(`Строка ${i + 1}: количество должно быть больше 0`);
        return;
      }
      cleaned.push({ laptop_id: +r.laptop_id, quantity: qty });
    });
    if (cleaned.length === 0) errs.push("Добавь хотя бы одну строку");
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const failed = [];
    for (let i = 0; i < cleaned.length; i++) {
      const r = cleaned[i];
      try {
        await OperationsAPI.create({
          laptop_id: r.laptop_id,
          type,
          quantity: r.quantity,
          comment: comment || undefined,
        });
      } catch (e) {
        const lap = laptops.find((l) => l.id === r.laptop_id);
        const label = lap ? `${lap.brand} ${lap.model}` : `id=${r.laptop_id}`;
        failed.push(`${label}: ${e.response?.data?.detail || "ошибка"}`);
      }
    }
    setSaving(false);
    if (failed.length) {
      setErrors(failed);
      return;
    }
    onSaved();
  };

  return (
    <form className="form-card" onSubmit={submit}>
      <h3>📦 Массовая операция по складу</h3>
      <div className="form-grid">
        <label className="form-label">
          Тип операции
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Приход (+)</option>
            <option value="outcome">Расход (−)</option>
            <option value="write_off">Списание</option>
          </select>
        </label>
        <label className="form-label">
          Комментарий (общий)
          <input
            className="input"
            value={comment}
            placeholder="например: поставка от 12.10.2026"
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
      </div>

      <h4 style={{ marginTop: 16 }}>Позиции</h4>
      <table className="table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ width: "60%" }}>Ноутбук</th>
            <th style={{ width: "20%" }}>Количество</th>
            <th style={{ width: "20%" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <select
                  className="input"
                  value={r.laptop_id}
                  onChange={(e) => updateRow(i, "laptop_id", e.target.value)}
                >
                  <option value="">— выбери ноутбук —</option>
                  {laptops.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brand} {l.model} (остаток: {l.quantity})
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={r.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                >
                  Удалить строку
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="btn btn-secondary" onClick={addRow}>
        + Добавить строку
      </button>

      {errors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {errors.map((e, i) => (
            <p key={i} className="error">⚠ {e}</p>
          ))}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: 16 }}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Сохранение..." : `Применить (${rows.length} поз.)`}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}