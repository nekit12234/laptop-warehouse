import axios from "axios";

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login: (username, password) => {
    const form = new URLSearchParams({ username, password });
    return client.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((r) => r.data);
  },
};

export const LaptopsAPI = {
  list: (params) => client.get("/laptops", { params }).then((r) => r.data),
  create: (d) => client.post("/laptops", d).then((r) => r.data),
  update: (id, d) => client.put(`/laptops/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/laptops/${id}`),
};

export const SuppliersAPI = {
  list: () => client.get("/suppliers").then((r) => r.data),
  create: (d) => client.post("/suppliers", d).then((r) => r.data),
};

export const OperationsAPI = {
  list: (params) => client.get("/operations", { params }).then((r) => r.data),
  create: (d) => client.post("/operations", d).then((r) => r.data),
};

export const DashboardAPI = {
  get: () => client.get("/dashboard").then((r) => r.data),
};