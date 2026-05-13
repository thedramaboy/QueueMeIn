import api from "./api.js";

export const patientService = {
  getAll: (params) => api.get("/patients", { params }).then((res) => res.data),
  getOne: (id) => api.get(`/patients/${id}`).then((res) => res.data),
  create: (data) => api.post("/patients", data).then((res) => res.data),
  update: (id, data) =>
    api.put(`/patients/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/patients/${id}`).then((res) => res.data),
};
