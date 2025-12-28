import { STORAGE_KEYS } from "../constants.js";

// Helper to read an array from localStorage
const get = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Helper to write an array to localStorage
const set = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Handle storage quota exceeded or other storage errors
  }
};

export const storageService = {
  users: {
    getAll: () => get(STORAGE_KEYS.USERS),
    add: (user) => {
      const users = get(STORAGE_KEYS.USERS);
      set(STORAGE_KEYS.USERS, [...users, user]);
    },
    find: (predicate) => get(STORAGE_KEYS.USERS).find(predicate),
  },
  projects: {
    getAll: (ownerId) => {
      const projects = get(STORAGE_KEYS.PROJECTS);
      return projects.filter((p) => p.ownerId === ownerId);
    },
    getById: (id) => {
      const projects = get(STORAGE_KEYS.PROJECTS);
      return projects.find((p) => p.id === id);
    },
    add: (project) => {
      const projects = get(STORAGE_KEYS.PROJECTS);
      const isDuplicate = projects.some(p => 
        p.ownerId === project.ownerId && 
        p.name.toLowerCase() === project.name.toLowerCase()
      );
      if (isDuplicate) throw new Error('A project with this name already exists');
      
      set(STORAGE_KEYS.PROJECTS, [...projects, project]);
    },
    update: (project) => {
      const projects = get(STORAGE_KEYS.PROJECTS);
      const isDuplicate = projects.some(p => 
        p.ownerId === project.ownerId && 
        p.name.toLowerCase() === project.name.toLowerCase() && 
        p.id !== project.id
      );
      if (isDuplicate) throw new Error('A project with this name already exists');

      const index = projects.findIndex((p) => p.id === project.id);
      if (index !== -1) {
        projects[index] = project;
        set(STORAGE_KEYS.PROJECTS, projects);
      }
    },
    delete: (id) => {
      let projects = get(STORAGE_KEYS.PROJECTS);
      projects = projects.filter((p) => p.id !== id);
      set(STORAGE_KEYS.PROJECTS, projects);

      const keyFiles = `${STORAGE_KEYS.PROJECTS}_files`;
      let files = get(keyFiles);
      files = files.filter((f) => f.projectId !== id);
      set(keyFiles, files);

      let scans = get(STORAGE_KEYS.SCANS);
      scans = scans.filter((s) => s.projectId !== id);
      set(STORAGE_KEYS.SCANS, scans);
    },
  },
  files: {
    getAll: (projectId) => {
      const key = `${STORAGE_KEYS.PROJECTS}_files`;
      let files = get(key);
      return files.filter((f) => f.projectId === projectId);
    },
    getById: (fileId) => {
      const key = `${STORAGE_KEYS.PROJECTS}_files`;
      let files = get(key);
      return files.find((f) => f.id === fileId);
    },
    add: (file) => {
      const key = `${STORAGE_KEYS.PROJECTS}_files`;
      const files = get(key);
      const isDuplicate = files.some(f => 
        f.projectId === file.projectId && 
        f.name.toLowerCase() === file.name.toLowerCase()
      );
      if (isDuplicate) throw new Error('A file with this name already exists in this project');

      set(key, [...files, file]);
    },
    update: (file) => {
      const key = `${STORAGE_KEYS.PROJECTS}_files`;
      const files = get(key);
      const isDuplicate = files.some(f => 
        f.projectId === file.projectId && 
        f.name.toLowerCase() === file.name.toLowerCase() && 
        f.id !== file.id
      );
      if (isDuplicate) throw new Error('A file with this name already exists');

      const index = files.findIndex((f) => f.id === file.id);
      if (index !== -1) {
        files[index] = file;
        set(key, files);
      }
    },
    delete: (fileId) => {
      const key = `${STORAGE_KEYS.PROJECTS}_files`;
      let files = get(key);
      files = files.filter((f) => f.id !== fileId);
      set(key, files);

      let scans = get(STORAGE_KEYS.SCANS);
      scans = scans.filter((s) => s.fileId !== fileId);
      set(STORAGE_KEYS.SCANS, scans);
    },
  },
  scans: {
    getAll: (projectId) => {
      let scans = get(STORAGE_KEYS.SCANS);
      return scans
        .filter((s) => s.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    },
    getLatest: (projectId) => {
      let scans = get(STORAGE_KEYS.SCANS);
      const projectScans = scans.filter((s) => s.projectId === projectId);
      projectScans.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return projectScans.length > 0 ? projectScans[0] : null;
    },
    getLatestForFile: (fileId) => {
      let scans = get(STORAGE_KEYS.SCANS);
      const fileScans = scans.filter((s) => s.fileId === fileId);
      fileScans.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return fileScans.length > 0 ? fileScans[0] : null;
    },
    add: (scan) => {
      const scans = get(STORAGE_KEYS.SCANS);
      set(STORAGE_KEYS.SCANS, [...scans, scan]);
    },
  },
  system: {
    exportAll: () => {
      const data = {};
      Object.values(STORAGE_KEYS).forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) data[key] = JSON.parse(val);
      });
      const fileKey = `${STORAGE_KEYS.PROJECTS}_files`;
      const filesVal = localStorage.getItem(fileKey);
      if (filesVal) data[fileKey] = JSON.parse(filesVal);

      return data;
    },
    importAll: (data) => {
      Object.entries(data).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });
    },
  },
};
