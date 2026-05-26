import api from "./api";

export const serviceService = {
  getAll: (params) =>
    api.get("/services", { params }).then((response) => response.data),
  getOne: (id) => api.get(`/services/${id}`).then((response) => response.data),
  create: (data) =>
    api.post("/services", data).then((response) => response.data),
  update: (id, data) =>
    api.put(`/services/${id}`, data).then((response) => response.data),
  delete: (id) =>
    api.delete(`/services/${id}`).then((response) => response.data),
};
