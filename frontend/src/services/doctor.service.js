import api from "./api";

export const doctorService = {
  getAll: () => api.get("/doctors").then((response) => response.data),
  getOne: (id) => api.get(`/doctors/${id}`).then((response) => response.data),
  create: (data) =>
    api.post("/doctors", data).then((response) => response.data),
  update: (id, data) =>
    api.put(`/doctors/${id}`, data).then((response) => response.data),
  delete: (id) =>
    api.delete(`/doctors/${id}`).then((response) => response.data),
};
