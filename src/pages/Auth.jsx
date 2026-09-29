import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/authApi';

export function validatePasswordPolicy(password) {
  const value = String(password || '');
  if (value.length < 10 || value.length > 128) return 'Use 10–128 characters.';
  if (/\s/.test(value)) return 'Password cannot contain spaces.';
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9\s]/.test(value)) return 'Include uppercase, lowercase, a number, and a symbol.';
  return null;
}

function PasswordInput({ id, label, value, onChange, error, hint, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="input-group">
      <input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} className={`form-control ${error ? 'is-invalid' : ''}`} value={value} onChange={onChange} aria-describedby={hint ? `${id}-hint` : undefined} required />
      <button className="btn btn-outline-secondary" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}><i className={`bi bi-eye${visible ? '-slash' : ''}`} /></button>
    </div>
    {hint && <div id={`${id}-hint`} className="form-text">{hint}</div>}
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>;
}

export default function Auth({ onLogin }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmation: '', otp: '', role: params.get('role') || 'farmer' });
  const [sentRegistrationCode, setSentRegistrationCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const role = params.get('role');
    if (['farmer', 'buyer', 'landowner'].includes(role)) setForm((current) => ({ ...current, role }));
  }, [params]);

  const passwordError = useMemo(() => form.password ? validatePasswordPolicy(form.password) : '', [form.password]);
  const setValue = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const clearMessages = () => { setError(''); setNotice(''); };
  const changeMode = (nextMode) => { clearMessages(); setMode(nextMode); setStep(1); setSentRegistrationCode(false); };

  async function submitLogin(event) {
    event.preventDefault(); clearMessages(); setLoading(true);
    const result = await authApi.login({ email: form.email, password: form.password });
    setLoading(false);
    if (!result.success) return setError(result.message || 'Unable to sign in.');
    onLogin?.(result.user); navigate(`/${result.user.role}/dashboard`);
  }

  async function submitRegistration(event) {
    event.preventDefault(); clearMessages();
    const email = form.email.trim();
    if (!form.fullName.trim() || !form.phone.trim() || passwordError || form.password !== form.confirmation) return setError(passwordError || 'Complete all fields and make sure passwords match.');
    setLoading(true);
    const result = sentRegistrationCode
      ? await authApi.verifyRegistrationAndRegister({ full_name: form.fullName.trim(), email, phone: form.phone.trim(), password: form.password, role: form.role, otp: form.otp.trim() })
      : await authApi.sendRegistrationVerification(email);
    setLoading(false);
    if (!result.success) return setError(result.message || 'Unable to continue registration.');
    if (!sentRegistrationCode) { setSentRegistrationCode(true); return setNotice(result.message); }
    onLogin?.(result.user); navigate(`/${result.user.role}/dashboard`);
  }

  async function sendReset(event) {
    event.preventDefault(); clearMessages(); setLoading(true);
    const result = await authApi.sendForgotPasswordOtp(form.email);
    setLoading(false);
    if (!result.success) return setError(result.message || 'Unable to send a verification code.');
    setStep(2); setNotice(result.message);
  }

  async function resetPassword(event) {
    event.preventDefault(); clearMessages();
    if (passwordError || form.password !== form.confirmation) return setError(passwordError || 'Passwords do not match.');
    setLoading(true);
    const result = await authApi.verifyOtpAndResetPassword({ target: form.email, otp: form.otp.trim(), newPassword: form.password });
    setLoading(false);
    if (!result.success) return setError(result.message || 'Unable to update your password.');
    setForm((current) => ({ ...current, password: '', confirmation: '', otp: '' }));
    setMode('login'); setStep(1); setNotice(result.message);
  }

  const resetMode = mode === 'forgot';
  return <section className="auth-page py-5"><div className="container"><div className="row justify-content-center"><div className="col-lg-5 col-md-8"><div className="auth-card">
    <div className="auth-card__brand"><span className="auth-card__mark">🌿</span><div><strong>AgriBridge</strong><small>Land, produce, and farming intelligence</small></div></div>
    {!resetMode && <div className="auth-tabs" role="tablist"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>Create account</button></div>}
    {error && <div className="alert alert-danger" role="alert"><i className="bi bi-exclamation-circle me-2" />{error}</div>}
    {notice && <div className="alert alert-success" role="status"><i className="bi bi-check-circle me-2" />{notice}</div>}
    {mode === 'login' && <form onSubmit={submitLogin} className="auth-form"><h1>Welcome back</h1><p>Sign in to continue to your workspace.</p><div className="auth-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" className="form-control" value={form.email} onChange={setValue('email')} required /></div><PasswordInput id="login-password" label="Password" value={form.password} onChange={setValue('password')} /><button className="btn btn-link auth-link" type="button" onClick={() => changeMode('forgot')}>Forgot password?</button><button className="btn btn-success w-100" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form>}
    {mode === 'register' && <form onSubmit={submitRegistration} className="auth-form"><h1>Create your account</h1><p>Choose your role and verify your email to get started.</p><div className="auth-role-grid">{[['farmer','Farmer'],['landowner','Landowner'],['buyer','Buyer']].map(([role, label]) => <button key={role} type="button" className={form.role === role ? 'selected' : ''} onClick={() => setForm((current) => ({ ...current, role }))}>{label}</button>)}</div><div className="auth-field"><label htmlFor="full-name">Full name</label><input id="full-name" className="form-control" autoComplete="name" value={form.fullName} onChange={setValue('fullName')} required /></div><div className="auth-field"><label htmlFor="register-email">Email address</label><input id="register-email" className="form-control" type="email" autoComplete="email" value={form.email} onChange={setValue('email')} required /></div><div className="auth-field"><label htmlFor="phone">Phone number</label><input id="phone" className="form-control" type="tel" autoComplete="tel" value={form.phone} onChange={setValue('phone')} required /></div><PasswordInput id="register-password" label="Password" value={form.password} onChange={setValue('password')} error={passwordError} hint="10+ characters with upper/lowercase, number, and symbol." autoComplete="new-password" /><PasswordInput id="confirm-password" label="Confirm password" value={form.confirmation} onChange={setValue('confirmation')} error={form.confirmation && form.confirmation !== form.password ? 'Passwords do not match.' : ''} autoComplete="new-password" />{sentRegistrationCode && <div className="auth-field"><label htmlFor="registration-code">Email verification code</label><input id="registration-code" inputMode="numeric" maxLength="6" className="form-control" value={form.otp} onChange={setValue('otp')} required /></div>}<button className="btn btn-success w-100" disabled={loading}>{loading ? 'Please wait…' : sentRegistrationCode ? 'Verify and create account' : 'Send verification code'}</button></form>}
    {mode === 'forgot' && <form onSubmit={step === 1 ? sendReset : resetPassword} className="auth-form"><button className="btn btn-link auth-back" type="button" onClick={() => changeMode('login')}><i className="bi bi-arrow-left" /> Back to sign in</button><h1>{step === 1 ? 'Reset your password' : 'Set a new password'}</h1><p>{step === 1 ? 'Enter your email and we’ll send a short-lived verification code.' : 'Enter the code from your email and choose a strong new password.'}</p><div className="auth-field"><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" className="form-control" autoComplete="email" value={form.email} onChange={setValue('email')} disabled={step === 2} required /></div>{step === 2 && <><div className="auth-field"><label htmlFor="reset-code">Verification code</label><input id="reset-code" inputMode="numeric" maxLength="6" className="form-control" value={form.otp} onChange={setValue('otp')} required /></div><PasswordInput id="new-password" label="New password" value={form.password} onChange={setValue('password')} error={passwordError} hint="10+ characters with upper/lowercase, number, and symbol." autoComplete="new-password" /><PasswordInput id="new-password-confirmation" label="Confirm new password" value={form.confirmation} onChange={setValue('confirmation')} error={form.confirmation && form.confirmation !== form.password ? 'Passwords do not match.' : ''} autoComplete="new-password" /></>}<button className="btn btn-success w-100" disabled={loading}>{loading ? 'Please wait…' : step === 1 ? 'Send verification code' : 'Update password'}</button>{step === 2 && <button className="btn btn-link auth-link" type="button" disabled={loading} onClick={sendReset}>Send a new code</button>}</form>}
  </div></div></div></div></section>;
}
