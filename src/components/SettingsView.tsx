import React, { useState } from 'react';
import { UserProfile, AppSettings, LanguageCode, ThemeMode } from '../types';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageFlag } from './LanguageFlag';
import { applyTheme } from '../services/themeManager';

interface SettingsViewProps {
  user: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenWelcome?: () => void;
  onAccountDeleted?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  onUpdateSettings,
  onEditProfile,
  onLogout,
  onOpenWelcome,
  onAccountDeleted
}) => {
  const { currentUser, linkGoogleAccount, changeUserPassword, updateUserData, deleteUserAccount } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentTheme: ThemeMode = user.themeMode || settings.theme || 'system';

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLanguage(newLang);
    onUpdateSettings({ language: newLang });
    updateUserData({ language: newLang });
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    applyTheme(newTheme);
    onUpdateSettings({ theme: newTheme });
    updateUserData({ themeMode: newTheme });
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteUserAccount();
      setShowDeleteModal(false);
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (err: any) {
      console.error('Error al eliminar cuenta:', err);
      const code = err?.code || '';
      if (code === 'auth/requires-recent-login') {
        setDeleteError(
          t('settings.requiresRecentLogin') ||
            'Por seguridad, debes cerrar sesión y volver a iniciar sesión antes de eliminar tu cuenta.'
        );
      } else {
        setDeleteError(err?.message || 'No se pudo eliminar la cuenta. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setLinkError(null);
    setLinkSuccess(null);
    try {
      await linkGoogleAccount();
      setLinkSuccess(t('settings.googleLinked'));
    } catch (err: any) {
      console.warn('Error linking Google account:', err);
      if (err?.code === 'auth/credential-already-in-use') {
        setLinkError(t('auth.error.emailInUse'));
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setLinkError(t('auth.error.googleCancelled'));
      } else {
        setLinkError(t('auth.error.generic'));
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError(t('auth.error.weakPassword'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassError(t('auth.error.passwordsDoNotMatch'));
      return;
    }

    setIsChangingPass(true);
    try {
      await changeUserPassword(newPassword);
      setPassSuccess(t('settings.passwordChangedSuccess'));
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess(null);
      }, 1500);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setPassError('Por seguridad, cierra sesión y vuelve a entrar antes de cambiar tu contraseña.');
      } else {
        setPassError(t('auth.error.generic'));
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  const languages: Array<{ code: LanguageCode; label: string }> = [
    { code: 'es', label: 'Español' },
    { code: 'ca', label: 'Català' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' }
  ];

  const themes: Array<{ mode: ThemeMode; label: string; icon: string }> = [
    { mode: 'light', label: t('settings.themeLight'), icon: 'light_mode' },
    { mode: 'dark', label: t('settings.themeDark'), icon: 'dark_mode' },
    { mode: 'system', label: t('settings.themeSystem'), icon: 'brightness_auto' }
  ];

  return (
    <div id="settings-view" className="space-y-5 pb-28">
      {/* Título y subtítulo limpios */}
      <div>
        <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">{t('settings.title')}</h2>
        <p className="text-xs text-[#6d7a76]">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tarjeta de Perfil y Cuenta */}
      <div className="p-5 rounded-3xl bg-white border border-[#e1e3e4] ambient-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName || 'Usuario'}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#006b5e]/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#006b5e]/10 text-[#006b5e] flex items-center justify-center font-bold text-lg ring-2 ring-[#006b5e]/20">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'E'}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-[#191c1d]">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-[#6d7a76]">
                {user.email || currentUser?.email || ''}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-[#006b5e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {t('settings.firebaseActive')}
                </span>
                {user.authProvider === 'google' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-blue-700">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Google
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="settings-edit-profile-btn"
              onClick={onEditProfile}
              className="p-2.5 rounded-xl bg-[#eceeef] hover:bg-[#e1e3e4] text-[#006b5e] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="hidden sm:inline">{t('settings.editProfile')}</span>
            </button>
          </div>
        </div>

        {/* Vincular con Google (si tiene cuenta por contraseña) */}
        {user.authProvider !== 'google' && (
          <div className="pt-3 border-t border-[#e1e3e4]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#191c1d] block">{t('settings.linkGoogle')}</span>
              <span className="text-[11px] text-[#6d7a76]">{t('settings.linkGoogleDesc')}</span>
            </div>
            <button
              id="settings-link-google-btn"
              type="button"
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className="px-3 py-1.5 rounded-xl border border-[#cfd3d4] bg-white hover:bg-[#f8fafb] text-xs font-bold text-[#191c1d] flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLinkingGoogle ? 'Vinculando...' : t('settings.linkGoogle')}</span>
            </button>
          </div>
        )}

        {linkError && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{linkError}</span>
          </div>
        )}
        {linkSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{linkSuccess}</span>
          </div>
        )}

        {/* Cambiar contraseña */}
        {user.authProvider !== 'google' && (
          <div className="pt-3 border-t border-[#e1e3e4]/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#191c1d] block">{t('settings.changePassword')}</span>
              <span className="text-[11px] text-[#6d7a76]">{t('settings.changePasswordDesc')}</span>
            </div>
            <button
              id="settings-open-change-pass-btn"
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#eceeef] hover:bg-[#e1e3e4] text-[#191c1d] text-xs font-bold transition-colors cursor-pointer"
            >
              {t('settings.changePassword')}
            </button>
          </div>
        )}
      </div>

      {/* Preferencias de la Aplicación */}
      <div className="p-5 rounded-3xl bg-white border border-[#e1e3e4] ambient-shadow space-y-4">
        <h3 className="text-sm font-bold text-[#191c1d] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006b5e] text-[20px]">tune</span>
          {t('settings.preferences')}
        </h3>

        {/* Selector de Tema (Light / Dark / System) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f2f4f5] flex items-center justify-center text-[#3d4946]">
              <span className="material-symbols-outlined text-[18px]">palette</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#191c1d] block">{t('settings.theme')}</span>
              <span className="text-[11px] text-[#6d7a76]">{t('settings.themeDesc')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#f2f4f5] p-1 rounded-xl border border-[#e1e3e4] self-start sm:self-auto">
            {themes.map((th) => (
              <button
                key={th.mode}
                type="button"
                onClick={() => handleThemeChange(th.mode)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTheme === th.mode
                    ? 'bg-white text-[#006b5e] shadow-xs'
                    : 'text-[#6d7a76] hover:text-[#191c1d]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{th.icon}</span>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notificaciones */}
        <div className="flex items-center justify-between py-1 border-t border-[#e1e3e4]/60 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f2f4f5] flex items-center justify-center text-[#3d4946]">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#191c1d] block">
                {t('settings.reminders')}
              </span>
              <span className="text-[11px] text-[#6d7a76]">{t('settings.remindersDesc')}</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => {
              onUpdateSettings({ notifications: e.target.checked });
            }}
            className="w-5 h-5 accent-[#006b5e] rounded cursor-pointer"
          />
        </div>

        {/* Selector de Idioma */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1 border-t border-[#e1e3e4]/60 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f2f4f5] flex items-center justify-center text-[#3d4946] shrink-0">
              <span className="material-symbols-outlined text-[18px]">language</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#191c1d] block">{t('settings.language')}</span>
              <span className="text-[11px] text-[#6d7a76]">{t('settings.languageDesc')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#f2f4f5] p-1 rounded-xl border border-[#e1e3e4] self-start sm:self-auto max-w-full">
            {languages.map((lang) => (
              <button
                key={lang.code}
                id={`settings-lang-${lang.code}-btn`}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  language === lang.code
                    ? 'bg-white text-[#006b5e] shadow-xs ring-1 ring-[#006b5e]/20'
                    : 'text-[#6d7a76] hover:text-[#191c1d] hover:bg-white/50'
                }`}
                title={lang.label}
              >
                <LanguageFlag code={lang.code} />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guía de Bienvenida / Tutorial */}
        {onOpenWelcome && (
          <div className="flex items-center justify-between py-1 border-t border-[#e1e3e4]/60 pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#006b5e]/10 flex items-center justify-center text-[#006b5e]">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#191c1d] block">{t('settings.onboardingGuide')}</span>
                <span className="text-[11px] text-[#6d7a76]">{t('settings.onboardingGuideDesc')}</span>
              </div>
            </div>

            <button
              id="settings-open-welcome-btn"
              onClick={onOpenWelcome}
              className="py-1.5 px-3 rounded-xl bg-[#006b5e] hover:bg-[#2bb19e] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
              <span>{t('settings.viewGuide')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Botón de Cerrar Sesión */}
      <div className="pt-2">
        <button
          id="settings-logout-btn"
          onClick={onLogout}
          className="w-full py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {t('settings.logout')}
        </button>
      </div>

      {/* Zona de Peligro: Eliminar Cuenta (Separada de Cerrar Sesión) */}
      <div className="p-5 rounded-3xl bg-red-50/50 border border-red-200/80 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-900">
              {t('settings.deleteAccountTitle')}
            </h4>
            <p className="text-[11px] text-red-700/80 mt-0.5 leading-relaxed">
              {t('settings.deleteAccountWarning')}
            </p>
          </div>
        </div>

        <button
          id="settings-open-delete-modal-btn"
          type="button"
          onClick={() => {
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">delete_forever</span>
          <span>{t('settings.deleteAccountBtn')}</span>
        </button>
      </div>

      {/* Modal de Confirmación para Eliminar Cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-red-200 text-[#191c1d] space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#191c1d]">
                {t('settings.deleteAccountConfirmTitle')}
              </h3>
              <p className="text-xs text-[#6d7a76] leading-relaxed">
                {t('settings.deleteAccountConfirmDesc')}
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                id="settings-cancel-delete-btn"
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-[#eceeef] text-xs font-bold text-[#191c1d] hover:bg-[#e1e3e4] cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                id="settings-confirm-delete-btn"
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isDeletingAccount ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>{t('settings.deleting')}</span>
                  </>
                ) : (
                  <span>{t('settings.confirmDelete')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#e1e3e4] text-[#191c1d] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191c1d]">{t('settings.changePassword')}</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-full bg-[#eceeef] text-[#191c1d] flex items-center justify-center hover:bg-[#e1e3e4] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {passError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#3d4946] block mb-1">
                  {t('settings.newPassword')} *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3d4946] block mb-1">
                  {t('settings.confirmNewPassword')} *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isChangingPass}
                  className="flex-1 py-2.5 rounded-xl bg-[#eceeef] text-xs font-bold text-[#191c1d] hover:bg-[#e1e3e4]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex-1 py-2.5 rounded-xl bg-[#006b5e] hover:bg-[#2bb19e] text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isChangingPass ? 'Guardando...' : t('settings.savePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
