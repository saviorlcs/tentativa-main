// frontend/src/api/http.js
import axios from "axios";

const http = axios.create({
  withCredentials: true, // garante que os cookies vão e voltam
  // NÃO defina baseURL aqui: usamos o proxy /api da Netlify
});

export default http;
