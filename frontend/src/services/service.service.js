import api from "./api";

export const serviceService = {
  getAll: (params) =>
    api.get("/services", { params }).then((response) => response.data),
};
