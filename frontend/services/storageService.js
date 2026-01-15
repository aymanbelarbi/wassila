import { api } from "./api";

export const storageService = {
  projects: {
    getAll: async () => {
      return await api.get('/projects');
    },
    getById: async (id) => {
      return await api.get(`/projects/${id}`);
    },
    add: async (project) => {
      return await api.post('/projects', project);
    },
    update: async (project) => {
      return await api.put(`/projects/${project.id}`, project);
    },
    delete: async (id) => {
      return await api.delete(`/projects/${id}`);
    },
  },
  files: {
    getAll: async (projectId) => {
      return await api.get(`/projects/${projectId}/files`);
    },
    getById: async (fileId) => {
      return await api.get(`/files/${fileId}`);
    },
    add: async (projectId, file) => {
      return await api.post(`/projects/${projectId}/files`, file);
    },
    update: async (file) => {
      return await api.put(`/files/${file.id}`, file);
    },
    delete: async (fileId) => {
      return await api.delete(`/files/${fileId}`);
    },
  },
  scans: {
    getAll: async (projectId, fileId) => {
      let url = '/scans?';
      if (projectId) url += `project_id=${projectId}&`;
      if (fileId) url += `file_id=${fileId}`;
      return await api.get(url);
    },
    getLatest: async (projectId) => {
      const scans = await api.get(`/scans?project_id=${projectId}`);
      return scans.length > 0 ? scans[0] : null;
    },
    getLatestForFile: async (fileId) => {
      const scans = await api.get(`/scans?file_id=${fileId}`);
      return scans.length > 0 ? scans[0] : null;
    },
    add: async (scan) => {
      return await api.post('/scans', scan);
    },
  },
};
