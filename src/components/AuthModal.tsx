import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!firstName.trim() || !lastName.trim()) {
          setErrorMsg(t('auth.nameRequired'));
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, firstName, lastName);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setErrorMsg(t('auth.invalidCredentials'));
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg(t('auth.emailInUse'));
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg(t('auth.weakPassword'));
      } else {
        setErrorMsg(err.message || t('auth.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-gray-500 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#006b5e]/10 text-[#006b5e] flex items-center justify-center font-bold text-xl">
            <span className="material-symbols-outlined text-[28px]">psychiatry</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-[#191c1d] tracking-tight">
              {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
            </h3>
            <p className="text-xs text-gray-500">
              {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
            </p>
          </div>
        </div>

        {/* Mensaje de error si existe */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-3 transition-colors text-sm font-bold text-gray-700 shadow-sm disabled:opacity-60 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <span>{t('auth.continueGoogle')}</span>
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-gray-200 flex-1"></div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase">{t('auth.orWithEmail')}</span>
          <div className="h-[1px] bg-gray-200 flex-1"></div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('auth.firstName')}</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Carlos"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006b5e] text-sm text-[#191c1d]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('auth.lastName')}</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mendoza"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006b5e] text-sm text-[#191c1d]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006b5e] text-sm text-[#191c1d]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006b5e] text-sm text-[#191c1d]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#006b5e] text-white hover:bg-[#005247] active:scale-[0.99] font-bold text-sm shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>{isRegister ? t('auth.createAccountBtn') : t('auth.signInBtn')}</span>
            )}
          </button>
        </form>

        {/* Alternar entre login / registro */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs font-semibold text-[#006b5e] hover:underline"
          >
            {isRegister ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
