import api from "./api.js";

export const categoryService = {
  getAll: () => api.get("/categories").then((response) => response.data),
  create: (data) =>
    api.post("/categories", data).then((response) => response.data),
  update: (id, data) =>
    api.put(`/categories/${id}`, data).then((response) => response.data),
  delete: (id) =>
    api.delete(`/categories/${id}`).then((response) => response.data),
};
