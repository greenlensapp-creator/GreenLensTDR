import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { processAndCompressImage, uploadUserProfilePhoto } from '../services/photoService';
import { BOTANICAL_AVATAR_PRESETS } from '../config/avatarPresets';

interface ProfilePhotoSetupViewProps {
  user: UserProfile;
  onComplete: (updated: Partial<UserProfile>) => void;
}

export const ProfilePhotoSetupView: React.FC<ProfilePhotoSetupViewProps> = ({
  user,
  onComplete
}) => {
  const { t } = useTranslation();
  const { updateUserData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  const [birthDate, setBirthDate] = useState<string>(user.birthDate || '');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(
    user.avatarUrl || BOTANICAL_AVATAR_PRESETS[0].url
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecciona un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setActivePresetId(null);

    try {
      const { dataUrl } = await processAndCompressImage(file);
      setSelectedAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Error procesando imagen de perfil:', err);
      setErrorMsg('No se pudo procesar la imagen seleccionada.');
    }
  };

  const handleSelectPreset = (preset: typeof BOTANICAL_AVATAR_PRESETS[0]) => {
    setErrorMsg(null);
    setSelectedFile(null);
    setActivePresetId(preset.id);
    setSelectedAvatarUrl(preset.url);
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg(t('auth.error.requiredFields'));
      return;
    }
    if (!birthDate) {
      setErrorMsg(t('auth.error.invalidBirthDate'));
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    let finalUrl = selectedAvatarUrl;

    if (selectedFile && user.uid) {
      try {
        finalUrl = await uploadUserProfilePhoto(user.uid, selectedFile);
      } catch (err) {
        console.warn('Error subiendo imagen a Storage, usando respaldo comprimido:', err);
      }
    }

    const payload: Partial<UserProfile> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate,
      avatarUrl: finalUrl,
      profileCompleted: true
    };

    try {
      await updateUserData(payload);
    } catch (err: any) {
      console.error('Error al guardar el perfil:', err);
    } finally {
      setIsSaving(false);
      onComplete(payload);
    }
  };

  return (
    <div
      id="profile-setup-screen"
      className="min-h-screen bg-[#f8fafb] text-[#191c1d] flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Barra superior con logo */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#006b5e] text-[#7ef7e2] flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[18px]">psychiatry</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[#006b5e]">GreenLens</span>
        </div>
      </div>

      {/* Contenedor central */}
      <div className="max-w-md mx-auto w-full my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e1e3e4] shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7ef7e2]/20 text-[#006b5e] text-xs font-bold mb-3">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>{t('initialProfile.title')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#191c1d] tracking-tight">
              {t('initialProfile.title')}
            </h1>
            <p className="text-xs sm:text-sm text-[#6d7a76] mt-1.5 max-w-sm mx-auto leading-relaxed">
              {t('initialProfile.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Principal y Selector */}
            <div className="flex flex-col items-center mb-2">
              <div className="relative group mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-[#006b5e]/20 shadow-md bg-[#f2f4f5] transition-all flex items-center justify-center">
                  {selectedAvatarUrl ? (
                    <img
                      src={selectedAvatarUrl}
                      alt="Vista previa del avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-[#006b5e]">
                      account_circle
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  disabled={isSaving}
                  title={t('profileSetup.uploadBtn')}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-xl bg-[#006b5e] text-white flex items-center justify-center shadow-lg hover:bg-[#2bb19e] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                id="profile-setup-file-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Botones de avatar: Seleccionar foto y DEBAJO Elegir avatar */}
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <button
                  id="profile-setup-upload-btn"
                  type="button"
                  onClick={handleTriggerUpload}
                  disabled={isSaving}
                  className="w-full py-2 px-3 rounded-xl bg-[#e6f4f1] text-[#006b5e] hover:bg-[#d0ede8] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                  <span>{selectedFile ? t('profileSetup.changePhoto') : t('profileSetup.uploadBtn')}</span>
                </button>

                <button
                  id="profile-setup-choose-avatar-btn"
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  disabled={isSaving}
                  className="w-full py-2 px-3 rounded-xl border border-[#cfd3d4] text-[#3d4946] hover:bg-[#f2f4f5] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">spa</span>
                  <span>{t('editProfile.choosePreset')}</span>
                </button>
              </div>
            </div>

            {/* Galería desplegable de 24 avatares botánicos */}
            {showPresets && (
              <div className="p-3 bg-[#f8fafb] rounded-2xl border border-[#e1e3e4] space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3d4946]">
                    {t('profileSetup.presetsTitle')} (24)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPresets(false)}
                    className="text-[10px] text-[#6d7a76] hover:text-[#191c1d]"
                  >
                    Ocultar
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                  {BOTANICAL_AVATAR_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id || selectedAvatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        disabled={isSaving}
                        title={preset.name}
                        className={`relative rounded-xl p-1 flex flex-col items-center gap-1 border transition-all ${
                          isSelected
                            ? 'border-[#006b5e] bg-[#e6f4f1] ring-2 ring-[#006b5e]/40 scale-105 z-10'
                            : 'border-transparent bg-white hover:border-[#cfd3d4]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden shadow-xs">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Campos de texto del perfil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-[#3d4946] block mb-1">
                  {t('auth.firstName')} *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Carlos"
                  className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3d4946] block mb-1">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mendoza"
                  className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#3d4946] block mb-1">
                {t('auth.birthDate')} *
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white"
              />
            </div>

            {/* Botón Guardar y continuar */}
            <div className="pt-2">
              <button
                id="profile-setup-save-btn"
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#006b5e] to-[#2bb19e] text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>{t('profileSetup.uploading')}</span>
                  </>
                ) : (
                  <span>{t('initialProfile.saveAndContinue')}</span>
                )}
              </button>
            </div>
          </form>
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
