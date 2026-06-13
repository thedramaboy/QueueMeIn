import api from "./api.js";

export const userService = {
  getAll: () => api.get("/users").then((r) => r.data),
  getOne: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  update: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};
