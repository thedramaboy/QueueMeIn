import api from "./api.js";

export const reportService = {
  getDashboard: () =>
    api.get("/reports/dashboard").then((response) => response.data),
  getSummary: (params) =>
    api.get("/reports/summary", { params }).then((response) => response.data),
  getBookings: (params) =>
    api.get("/reports/bookings", { params }).then((response) => response.data),
  getPatients: (params) =>
    api.get("/reports/patients", { params }).then((response) => response.data),
};
