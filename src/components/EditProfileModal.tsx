import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { uploadUserProfilePhoto, processAndCompressImage } from '../services/photoService';
import { BOTANICAL_AVATAR_PRESETS } from '../config/avatarPresets';

interface EditProfileModalProps {
  user: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onSave, onClose }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const email = user.email; // Read-only
  const [birthDate, setBirthDate] = useState(user.birthDate);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    setPhotoError(null);
    setSelectedFile(file);

    try {
      const { dataUrl } = await processAndCompressImage(file);
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      console.error('Error generando vista previa:', err);
      setPhotoError('No se pudo procesar la imagen seleccionada.');
    }
  };

  const handleSelectPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedFile(null);
    setAvatarUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setPhotoError(null);

    let finalAvatarUrl = avatarUrl;

    if (selectedFile && user.uid) {
      try {
        finalAvatarUrl = await uploadUserProfilePhoto(user.uid, selectedFile);
      } catch (err: any) {
        console.warn('Error subiendo foto de perfil:', err);
      }
    }

    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      avatarUrl: finalAvatarUrl
    });

    setIsUploading(false);
    onClose();
  };

  return (
    <div
      id="edit-profile-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="edit-profile-modal-card"
        className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#e1e3e4] text-[#191c1d] space-y-4 my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#191c1d]">{t('editProfile.title')}</h2>
          <button
            id="edit-profile-close-btn"
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-full bg-[#eceeef] text-[#191c1d] flex items-center justify-center hover:bg-[#e1e3e4] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {photoError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{photoError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar actual y selector */}
          <div className="bg-[#f8fafb] p-3.5 rounded-2xl border border-[#e1e3e4] space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar del usuario"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#006b5e] shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#006b5e]/10 text-[#006b5e] flex items-center justify-center font-bold text-xl ring-2 ring-[#006b5e]">
                    {firstName ? firstName.charAt(0).toUpperCase() : 'E'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSelectPhotoClick}
                  disabled={isUploading}
                  title={t('editProfile.changePhoto')}
                  className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-[#191c1d] block truncate">
                  {t('editProfile.avatarLabel')}
                </span>
                <p className="text-[11px] text-[#6d7a76] mt-0.5 truncate">
                  {t('editProfile.photoHint')}
                </p>

                <input
                  ref={fileInputRef}
                  id="profile-photo-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-stretch gap-1.5 mt-2">
                  <button
                    id="profile-photo-select-btn"
                    type="button"
                    onClick={handleSelectPhotoClick}
                    disabled={isUploading}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e6f4f1] text-[#006b5e] hover:bg-[#d0ede8] font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                    <span>{selectedFile ? t('editProfile.changePhoto') : t('editProfile.selectPhoto')}</span>
                  </button>

                  <button
                    id="profile-photo-choose-avatar-btn"
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#cfd3d4] text-[#3d4946] hover:bg-[#eceeef] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">spa</span>
                    <span>{t('editProfile.choosePreset')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Galería de avatares */}
            {showPresets && (
              <div className="pt-2 border-t border-[#e1e3e4]">
                <span className="text-[11px] font-bold text-[#3d4946] block mb-2">
                  {t('profileSetup.presetsTitle')}
                </span>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-xl border border-[#e1e3e4]">
                  {BOTANICAL_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      title={preset.name}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                        avatarUrl === preset.url
                          ? 'border-[#006b5e] ring-2 ring-[#006b5e]/30'
                          : 'border-transparent'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nombre y Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#3d4946]">{t('auth.firstName')}</label>
              <input
                id="edit-firstname-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#3d4946]">{t('auth.lastName')}</label>
              <input
                id="edit-lastname-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Correo Electrónico (READ-ONLY) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#3d4946]">{t('auth.email')}</label>
              <span className="text-[10px] text-[#6d7a76] flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                {t('editProfile.emailReadOnly')}
              </span>
            </div>
            <input
              id="edit-email-input"
              type="email"
              value={email}
              disabled
              readOnly
              className="w-full px-3 py-2 rounded-xl bg-[#e9ecef] border border-[#d1d5db] text-xs text-[#555e5b] cursor-not-allowed select-none font-medium"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#3d4946]">{t('auth.birthDate')}</label>
            <input
              id="edit-birthdate-input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              id="edit-profile-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl bg-[#eceeef] text-xs font-bold text-[#191c1d] hover:bg-[#e1e3e4] transition-colors"
            >
              {t('editProfile.cancel')}
            </button>
            <button
              id="edit-profile-save-btn"
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl bg-[#006b5e] hover:bg-[#2bb19e] text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>{t('editProfile.uploading')}</span>
                </>
              ) : (
                <span>{t('editProfile.save')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
