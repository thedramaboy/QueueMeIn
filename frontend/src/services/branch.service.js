import api from "./api";

export const branchService = {
  getAll: () => api.get("/branches").then((response) => response.data),
};
