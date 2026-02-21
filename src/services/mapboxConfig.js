// Lightweight MapboxGL initializer — safe to require even if package not installed.
let MapboxGL = null;
let _token = null;
let _lastError = null;

try {
  const MB = require('@rnmapbox/maps');
  MapboxGL = MB && (MB.default || MB);
} catch (e) {
  MapboxGL = null;
  try {
    _lastError = e && (e.message || String(e));
  } catch (ee) {
    _lastError = String(e);
  }
}

const getEnvToken = () => process.env.MAPBOX_ACCESS_TOKEN || null;

const isAvailable = () => !!MapboxGL;

const setAccessToken = token => {
  if (!token) return false;
  _token = token;
  if (MapboxGL && typeof MapboxGL.setAccessToken === 'function') {
    try {
      MapboxGL.setAccessToken(token);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};

const getToken = () => _token || getEnvToken();
const getLastError = () => _lastError;

const init = ({ token = null } = {}) => {
  const t = token || getEnvToken();
  if (!t) return { ok: false, reason: 'no-token' };
  const ok = setAccessToken(t);
  return { ok, token: t };
};

module.exports = {
  MapboxGL,
  init,
  setAccessToken,
  getToken,
  isAvailable,
  getLastError,
};
