import api from "./api.js";

export const scheduleService = {
  getAll: (params) =>
    api.get("/schedules", { params }).then((response) => response.data),
  getOne: (id) => api.get(`/schedules/${id}`).then((response) => response.data),
  create: (data) =>
    api.post("/schedules", data).then((response) => response.data),
  update: (id, data) =>
    api.put(`/schedules/${id}`, data).then((response) => response.data),
  delete: (id) =>
    api.delete(`/schedules/${id}`).then((response) => response.data),
};
