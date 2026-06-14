import api from "./api.js";

export const bookingService = {
  getAll: (params) => api.get("/bookings", { params }).then((res) => res.data),
  getOne: (id) => api.get(`/bookings/${id}`).then((res) => res.data),
  create: (data) => api.post("/bookings", data).then((res) => res.data),
  updateStatus: (id, status) =>
    api.patch(`/bookings/${id}/status`, { status }).then((res) => res.data),
  update: (id, data) =>
    api.patch(`/bookings/${id}`, data).then((res) => res.data),
  reschedule: (id, data) =>
    api.post(`/bookings/${id}/reschedule`, data).then((res) => res.data),
  markAsPaid: (id, data) =>
    api.patch(`/bookings/${id}/payment`, data).then((res) => res.data),
};
