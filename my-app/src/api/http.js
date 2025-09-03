import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:4000" });

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token");
  if (raw) {
    const value = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
    config.headers.Authorization = value;   // ← 항상 Bearer 토큰 형태로
  }
  return config;
});

export default http;
