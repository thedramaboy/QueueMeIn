import api from "./api";

export const branchService = {
  getAll: () => api.get("/branches").then((response) => response.data),
  getOne: (id) => api.get(`/branches/${id}`).then((response) => response.data),
  create: (data) =>
    api.post("/branches", data).then((response) => response.data),
  update: (id, data) =>
    api.put(`/branches/${id}`, data).then((response) => response.data),
  delete: (id) =>
    api.delete(`/branches/${id}`).then((response) => response.data),
};
