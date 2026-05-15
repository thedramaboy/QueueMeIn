import api from "./api";

export const doctorService = {
  getAll: () => api.get("/doctors").then((response) => response.data),
};
