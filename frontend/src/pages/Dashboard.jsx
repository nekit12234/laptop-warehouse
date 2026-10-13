import { useEffect, useState } from "react";
import { DashboardAPI } from "../api";
import Card from "../components/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    DashboardAPI.get()
      .then(setData)
      .catch(() => setError("Не удалось загрузить данные"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Загрузка...</p>;

  return (
    <div>
      <div className="dashboard__cards">
        <Card title="Ноутбуков на складе" value={data.total_quantity} />
        <Card title="Моделей в каталоге" value={data.unique_models} />
        <Card
          title="Себестоимость склада"
          value={data.purchase_value.toLocaleString("ru-RU") + " ₽"}
        />
        <Card
          title="Низкий остаток"
          value={data.low_stock_count}
          variant={data.low_stock_count ? "danger" : "success"}
        />
      </div>

      <h3>Топ брендов по количеству</h3>
      <div className="dashboard__chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.top_brands}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="brand" />
            <YAxis />
            <Bar dataKey="quantity" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3>⚠️ Товары с низким остатком</h3>
      {data.low_stock_items.length === 0 ? (
        <p className="muted">Все остатки в норме ✅</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Бренд</th>
              <th>Модель</th>
              <th>Остаток</th>
              <th>Минимум</th>
            </tr>
          </thead>
          <tbody>
            {data.low_stock_items.map((l) => (
              <tr key={l.id}>
                <td>{l.brand}</td>
                <td>{l.model}</td>
                <td className="table__num table__num--danger">{l.quantity}</td>
                <td className="table__num">{l.min_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}