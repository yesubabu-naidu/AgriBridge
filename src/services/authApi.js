const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, body) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    return { ...data, success: Boolean(response.ok && data.success) };
  } catch {
    return { success: false, message: 'Unable to reach the authentication server. Please try again.' };
  }
}

export const authApi = {
  async login({ email, password }) {
    const result = await request('/auth/login', { email: String(email || '').trim().toLowerCase(), password });
    if (result.success && result.data?.token && result.data?.user) {
      localStorage.setItem('agribridge_token', result.data.token);
      return { success: true, user: result.data.user };
    }
    return result;
  },
  sendRegistrationVerification(email) {
    return request('/auth/send-registration-otp', { email: String(email || '').trim().toLowerCase() });
  },
  async verifyRegistrationAndRegister(payload) {
    const result = await request('/auth/verify-registration', payload);
    if (result.success && result.data?.token && result.data?.user) {
      localStorage.setItem('agribridge_token', result.data.token);
      return { success: true, user: result.data.user, message: result.message };
    }
    return result;
  },
  sendForgotPasswordOtp(target) {
    return request('/auth/send-otp', { target: String(target || '').trim().toLowerCase(), channel: 'email' });
  },
  verifyOtpAndResetPassword({ target, otp, newPassword }) {
    return request('/auth/reset-password', { target: String(target || '').trim().toLowerCase(), otp, newPassword });
  }
};
