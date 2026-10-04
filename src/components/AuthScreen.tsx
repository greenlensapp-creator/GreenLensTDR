import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageCode } from '../types';
import { LanguageFlag } from './LanguageFlag';

interface AuthScreenProps {
  notificationMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ notificationMessage }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Selector de idioma rápido
  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'ca', label: 'Català' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' }
  ];

  const validateEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  const getFriendlyErrorMessage = (err: any): string => {
    const code = (err?.code || '').toLowerCase();
    const rawMsg = (err?.message || '').toLowerCase();

    if (code.includes('user-not-found') || rawMsg.includes('user-not-found')) {
      return t('auth.error.userNotFound');
    }
    if (code.includes('wrong-password') || rawMsg.includes('wrong-password')) {
      return t('auth.error.wrongPassword');
    }
    if (code.includes('email-already-in-use') || rawMsg.includes('email-already-in-use')) {
      return t('auth.error.emailInUse');
    }
    if (code.includes('invalid-email') || rawMsg.includes('invalid-email')) {
      return t('auth.error.invalidEmail');
    }
    if (code.includes('weak-password') || rawMsg.includes('weak-password')) {
      return t('auth.error.weakPassword');
    }
    if (code.includes('network-request-failed') || rawMsg.includes('network')) {
      return t('auth.error.networkError');
    }
    if (code.includes('too-many-requests') || rawMsg.includes('too-many-requests')) {
      return t('auth.error.tooManyRequests');
    }
    if (code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
      return t('auth.error.invalidCredentials');
    }
    if (code.includes('popup-closed-by-user')) {
      return t('auth.error.googleCancelled');
    }
    return t('auth.error.generic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);

    const cleanEmail = email.trim();

    if (mode === 'forgot') {
      if (!cleanEmail || !validateEmail(cleanEmail)) {
        setErrorMessage(t('auth.error.invalidEmail'));
        return;
      }
      setIsLoading(true);
      try {
        await resetPassword(cleanEmail);
        setResetSuccessMessage(t('auth.resetLinkSent'));
      } catch (err: any) {
        setErrorMessage(getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password || !confirmPassword || !birthDate.trim()) {
        setErrorMessage(t('auth.error.requiredFields'));
        return;
      }
      if (!validateEmail(cleanEmail)) {
        setErrorMessage(t('auth.error.invalidEmail'));
        return;
      }
      if (password.length < 6) {
        setErrorMessage(t('auth.error.weakPassword'));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('auth.error.passwordsDoNotMatch'));
        return;
      }
    } else {
      if (!cleanEmail || !password) {
        setErrorMessage(t('auth.error.requiredFields'));
        return;
      }
      if (!validateEmail(cleanEmail)) {
        setErrorMessage(t('auth.error.invalidEmail'));
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await signUpWithEmail(
          cleanEmail,
          password,
          firstName,
          lastName,
          birthDate,
          language
        );
      } else {
        await signInWithEmail(cleanEmail, password);
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      if (err?.code === 'auth/wrong-password' || err?.message?.includes('wrong-password')) {
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-screen"
      className="min-h-screen bg-[#f8fafb] text-[#191c1d] flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Barra superior con selector de idioma */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#006b5e] text-[#7ef7e2] flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[18px]">psychiatry</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[#006b5e]">GreenLens</span>
        </div>

        {/* Language selector chips */}
        <div className="flex items-center gap-1 bg-[#eceeef] p-1 rounded-xl">
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                language === lang.code
                  ? 'bg-white text-[#006b5e] shadow-sm'
                  : 'text-[#6d7a76] hover:text-[#191c1d]'
              }`}
              title={lang.label}
            >
              <LanguageFlag code={lang.code} />
              <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tarjeta Central de Autenticación */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e1e3e4] ambient-shadow">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#7ef7e2]/20 text-[#006b5e] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">
                {mode === 'login' ? 'lock' : 'person_add'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#191c1d] tracking-tight">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#6d7a76] mt-1">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex p-1 bg-[#f2f4f5] rounded-2xl mb-6">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#006b5e] shadow-sm'
                  : 'text-[#6d7a76] hover:text-[#191c1d]'
              }`}
            >
              {t('auth.loginButton')}
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#006b5e] shadow-sm'
                  : 'text-[#6d7a76] hover:text-[#191c1d]'
              }`}
            >
              {t('auth.registerButton')}
            </button>
          </div>

          {/* Notification banner (e.g. Account deleted) */}
          {notificationMessage && (
            <div
              id="auth-notification-alert"
              className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                check_circle
              </span>
              <span className="font-medium leading-relaxed">{notificationMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="auth-error-alert"
              className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-900 text-xs flex items-start gap-2.5 animate-shake"
            >
              <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Reset link success banner */}
          {resetSuccessMessage && (
            <div
              id="auth-reset-success-alert"
              className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5"
            >
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                check_circle
              </span>
              <span className="font-medium leading-relaxed">{resetSuccessMessage}</span>
            </div>
          )}

          {mode === 'forgot' ? (
            /* Pantalla de recuperación de contraseña */
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-base font-bold text-[#191c1d]">
                  {t('auth.resetPasswordTitle')}
                </h2>
                <p className="text-xs text-[#6d7a76] mt-1 leading-relaxed">
                  {t('auth.resetPasswordDesc')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                    {t('auth.email')} *
                  </label>
                  <input
                    id="auth-reset-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                  />
                </div>

                <button
                  id="auth-send-reset-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#006b5e] to-[#2bb19e] text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>{t('auth.sendResetLink')}</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setResetSuccessMessage(null);
                  }}
                  className="text-xs text-[#006b5e] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  <span>{t('auth.backToLogin')}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google Sign-in */}
              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-[#cfd3d4] hover:bg-[#f8fafb] text-[#191c1d] font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 mb-4 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t('auth.googleButton')}</span>
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-[#e1e3e4]"></div>
                <span className="flex-shrink mx-3 text-[11px] text-[#6d7a76] font-medium">
                  {t('auth.orEmail')}
                </span>
                <div className="flex-grow border-t border-[#e1e3e4]"></div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                          {t('auth.firstName')} *
                        </label>
                        <input
                          id="register-firstname-input"
                          type="text"
                          required
                          autoComplete="given-name"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder={t('auth.firstNamePlaceholder')}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                          {t('auth.lastName')} *
                        </label>
                        <input
                          id="register-lastname-input"
                          type="text"
                          required
                          autoComplete="family-name"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder={t('auth.lastNamePlaceholder')}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                        {t('auth.birthDate')} *
                      </label>
                      <input
                        id="register-birthdate-input"
                        type="date"
                        required
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                    {t('auth.email')} *
                  </label>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#3d4946]">
                      {t('auth.password')} *
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMessage(null);
                          setResetSuccessMessage(null);
                        }}
                        className="text-[11px] text-[#006b5e] hover:underline font-semibold cursor-pointer"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                  />
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#3d4946] mb-1">
                      {t('auth.confirmPassword')} *
                    </label>
                    <input
                      id="auth-confirm-password-input"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cfd3d4] bg-[#f8fafb] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
                    />
                  </div>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#006b5e] to-[#2bb19e] text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>{mode === 'register' ? t('auth.creatingAccount') : t('auth.checkingSession')}</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}</span>
                  )}
                </button>
              </form>

              {/* Toggle bottom link */}
              <div className="text-center mt-5">
                <button
                  id="auth-toggle-mode-btn"
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setErrorMessage(null);
                    setResetSuccessMessage(null);
                  }}
                  className="text-xs text-[#006b5e] hover:underline font-semibold cursor-pointer"
                >
                  {mode === 'login' ? t('auth.needAccount') : t('auth.haveAccount')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center py-2">
        <p className="text-[11px] text-[#6d7a76]">
          GreenLens • Identificación y Cuidado Botánico
        </p>
      </div>
    </div>
  );
};
