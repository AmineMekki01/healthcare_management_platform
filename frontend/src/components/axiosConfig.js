import axios from 'axios';

const getBackendURL = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const instance = axios.create({
  baseURL: getBackendURL(),
});

function getToken() {
  return localStorage.getItem('token');
}

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

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

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await axios.post(
          `${getBackendURL()}/api/v1/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const newToken = refreshResponse.data.accessToken;
        localStorage.setItem('token', newToken);

        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return instance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
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