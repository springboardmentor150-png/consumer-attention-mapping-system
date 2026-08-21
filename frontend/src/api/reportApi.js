import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getSummary = () => api.get("/reports/summary");

export const downloadCSV = () => {
  window.open("http://127.0.0.1:8000/reports/csv");
};

export const downloadPDF = () => {
  window.open("http://127.0.0.1:8000/reports/pdf");
};
