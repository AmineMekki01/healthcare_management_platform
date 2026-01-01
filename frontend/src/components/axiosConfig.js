import axios from 'axios';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

const getBackendURL = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const instance = axios.create({
  baseURL: getBackendURL(),
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && method !== 'options') {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const hasLocalSession = () => {
  return Boolean(
    localStorage.getItem('userId') ||
    localStorage.getItem('doctorId') ||
    localStorage.getItem('patientId') ||
    localStorage.getItem('receptionistId') ||
    localStorage.getItem('userType')
  );
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.url?.includes('/api/v1/refresh-token')) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (!hasLocalSession()) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => instance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        await instance.post('/api/v1/refresh-token', {});
        processQueue(null, null);
        return instance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('doctorId');
        localStorage.removeItem('patientId');
        localStorage.removeItem('receptionistId');
        localStorage.removeItem('assignedDoctorId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userProfilePictureUrl');
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRoleMode');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;