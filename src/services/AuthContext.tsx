import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  linkWithPopup,
  updatePassword,
  deleteUser,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { UserProfile, LanguageCode, ThemeMode } from '../types';
import { saveUserProfile, clearAllLocalUserData } from './storageService';
import { applyTheme } from './themeManager';
import { BOTANICAL_AVATAR_PRESETS } from '../config/avatarPresets';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile;
  loading: boolean;
  isNewUserSignup: boolean;
  clearNewUserSignup: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    birthDate: string,
    language?: LanguageCode
  ) => Promise<void>;
  signOut: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  changeUserPassword: (newPass: string) => Promise<void>;
}

const BLANK_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  avatarUrl: BOTANICAL_AVATAR_PRESETS[0].url,
  isLoggedIn: false
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Variable temporal para evitar condiciones de carrera durante el registro
let pendingSignupData: {
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  language: LanguageCode;
} | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(BLANK_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNewUserSignup, setIsNewUserSignup] = useState<boolean>(false);

  // Escuchar cambios de autenticación en Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          // Cargar datos extendidos desde Firestore en users/{uid}
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const hasCompletedProfile =
              data.profileCompleted === true &&
              Boolean(data.firstName) &&
              Boolean(data.birthDate);
            const hasCompletedWelcome = data.welcomeCompleted === true;
            const hasCompletedOnboarding = data.onboardingCompleted === true;

            const profile: UserProfile = {
              uid: user.uid,
              firstName: data.firstName || pendingSignupData?.firstName || user.displayName?.split(' ')[0] || '',
              lastName: data.lastName || pendingSignupData?.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
              email: user.email || data.email || pendingSignupData?.email || '',
              birthDate: data.birthDate || pendingSignupData?.birthDate || '',
              avatarUrl:
                data.avatarUrl ||
                user.photoURL ||
                BOTANICAL_AVATAR_PRESETS[0].url,
              isLoggedIn: true,
              language: data.language || pendingSignupData?.language || 'es',
              themeMode: data.themeMode || 'system',
              profileCompleted: hasCompletedProfile,
              welcomeCompleted: hasCompletedWelcome,
              onboardingCompleted: hasCompletedOnboarding,
              authProvider: (user.providerData[0]?.providerId === 'google.com'
                ? 'google'
                : 'password') as 'google' | 'password'
            };
            setUserProfile(profile);
            saveUserProfile(profile);
            if (profile.themeMode) {
              applyTheme(profile.themeMode);
            }
          } else {
            // Primer login del usuario (ej: vía Google o registro inicial sin Firestore previo)
            const isGoogle = user.providerData[0]?.providerId === 'google.com';
            const defaultFirst = pendingSignupData?.firstName || user.displayName?.split(' ')[0] || '';
            const defaultLast = pendingSignupData?.lastName || user.displayName?.split(' ').slice(1).join(' ') || '';
            const defaultBirth = pendingSignupData?.birthDate || '';
            const defaultLang = pendingSignupData?.language || 'es';

            // Para Google, como no tenemos birthDate aún, profileCompleted es false
            const isProfileDone = Boolean(defaultFirst && defaultBirth);

            const newProfile: UserProfile = {
              uid: user.uid,
              firstName: defaultFirst,
              lastName: defaultLast,
              email: user.email || pendingSignupData?.email || '',
              birthDate: defaultBirth,
              avatarUrl:
                user.photoURL ||
                BOTANICAL_AVATAR_PRESETS[0].url,
              isLoggedIn: true,
              language: defaultLang,
              themeMode: 'system',
              profileCompleted: isProfileDone,
              welcomeCompleted: false,
              onboardingCompleted: false,
              authProvider: isGoogle ? 'google' : 'password'
            };

            try {
              await setDoc(userDocRef, {
                ...newProfile,
                createdAt: new Date().toISOString()
              });

              if (user.email) {
                await setDoc(
                  doc(db, 'registered_emails', user.email.toLowerCase()),
                  {
                    registered: true,
                    uid: user.uid,
                    provider: isGoogle ? 'google' : 'password',
                    createdAt: new Date().toISOString()
                  },
                  { merge: true }
                );
              }
            } catch (err) {
              console.warn('Error creando perfil en Firestore:', err);
            }

            setUserProfile(newProfile);
            saveUserProfile(newProfile);
            applyTheme('system');
          }
        } else {
          // Usuario no autenticado
          setCurrentUser(null);
          setUserProfile(BLANK_PROFILE);
          saveUserProfile(BLANK_PROFILE);
        }
      } catch (err) {
        console.error('Error procesando estado de autenticación:', err);
        if (user) {
          const fallback: UserProfile = {
            uid: user.uid,
            firstName: pendingSignupData?.firstName || user.displayName?.split(' ')[0] || '',
            lastName: pendingSignupData?.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || pendingSignupData?.email || '',
            birthDate: pendingSignupData?.birthDate || '',
            avatarUrl:
              user.photoURL ||
              BOTANICAL_AVATAR_PRESETS[0].url,
            isLoggedIn: true,
            profileCompleted: false,
            welcomeCompleted: false,
            onboardingCompleted: false
          };
          setUserProfile(fallback);
        } else {
          setCurrentUser(null);
          setUserProfile(BLANK_PROFILE);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error con Google Sign-In:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = (email || '').trim();
    const cleanEmailKey = cleanEmail.toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass || '');
    } catch (error: any) {
      const code = error?.code || '';
      console.warn('Error con Email Sign-In (código):', code);

      // Si Firebase retorna un error como 'auth/invalid-credential', 'auth/invalid-login-credentials',
      // o 'auth/wrong-password' / 'auth/user-not-found':
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        let emailExists = false;

        // 1. Consultar colección registered_emails en Firestore
        try {
          const regDoc = await getDoc(doc(db, 'registered_emails', cleanEmailKey));
          if (regDoc.exists()) {
            emailExists = true;
          }
        } catch (dbErr) {
          console.warn('No se pudo verificar registered_emails en Firestore:', dbErr);
        }

        // 2. Si no lo encontramos en Firestore, consultar fetchSignInMethodsForEmail
        if (!emailExists) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
            if (methods && methods.length > 0) {
              emailExists = true;
            }
          } catch (subErr: any) {
            // Ignorar errores de métodos
          }
        }

        if (!emailExists) {
          const notFoundErr = new Error('auth/user-not-found');
          (notFoundErr as any).code = 'auth/user-not-found';
          throw notFoundErr;
        } else {
          const wrongPassErr = new Error('auth/wrong-password');
          (wrongPassErr as any).code = 'auth/wrong-password';
          throw wrongPassErr;
        }
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    birthDate: string,
    language: LanguageCode = 'es'
  ) => {
    setLoading(true);
    const cleanEmail = (email || '').trim();
    const cleanEmailKey = cleanEmail.toLowerCase();
    const cleanFirst = (firstName || '').trim();
    const cleanLast = (lastName || '').trim();
    const cleanBirth = (birthDate || '').trim();

    // Guardar en variable de registro para sincronización atómica
    pendingSignupData = {
      email: cleanEmail,
      firstName: cleanFirst,
      lastName: cleanLast,
      birthDate: cleanBirth,
      language: language
    };

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const fullName = `${cleanFirst} ${cleanLast}`.trim();
      
      try {
        await firebaseUpdateProfile(cred.user, { displayName: fullName });
      } catch (e) {
        console.warn('No se pudo actualizar el displayName en Auth:', e);
      }

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        birthDate: birthDate,
        avatarUrl: BOTANICAL_AVATAR_PRESETS[0].url,
        isLoggedIn: true,
        language: language,
        profileCompleted: true,
        welcomeCompleted: false,
        onboardingCompleted: false,
        authProvider: 'password'
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...newProfile,
          createdAt: new Date().toISOString()
        });

        await setDoc(
          doc(db, 'registered_emails', cleanEmailKey),
          {
            registered: true,
            uid: cred.user.uid,
            provider: 'password',
            createdAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Error guardando perfil en Firestore en registro:', e);
      }

      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      pendingSignupData = null;
      setIsNewUserSignup(true);
    } catch (error: any) {
      pendingSignupData = null;
      console.error('Error en registro con Firebase:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearNewUserSignup = () => {
    setIsNewUserSignup(false);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      clearAllLocalUserData();
      setCurrentUser(null);
      setUserProfile(BLANK_PROFILE);
      saveUserProfile(BLANK_PROFILE);
      setIsNewUserSignup(false);
    } catch (error: any) {
      console.error('Error al cerrar sesión en Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUserAccount = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user is currently authenticated.');
    const userToDelete = auth.currentUser;
    const uid = userToDelete.uid;
    const emailKey = userToDelete.email ? userToDelete.email.toLowerCase() : null;

    try {
      // 1. Eliminar escaneos de Firestore
      try {
        const scansRef = collection(db, 'users', uid, 'scans');
        const scansSnap = await getDocs(scansRef);
        const deletePromises = scansSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
      } catch (scanErr) {
        console.warn('Error eliminando scans de usuario en Firestore:', scanErr);
      }

      // 2. Eliminar documento del usuario en users/{uid}
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (uErr) {
        console.warn('Error eliminando users/{uid} en Firestore:', uErr);
      }

      // 3. Eliminar de registered_emails si existe
      if (emailKey) {
        try {
          await deleteDoc(doc(db, 'registered_emails', emailKey));
        } catch (regErr) {
          console.warn('Error eliminando registered_emails en Firestore:', regErr);
        }
      }

      // 4. Limpiar todo el estado local del navegador
      clearAllLocalUserData();

      // 5. Eliminar usuario en Firebase Authentication
      await deleteUser(userToDelete);

      // 6. Resetear estado en memoria
      setCurrentUser(null);
      setUserProfile(BLANK_PROFILE);
      saveUserProfile(BLANK_PROFILE);
      setIsNewUserSignup(false);
    } catch (err: any) {
      console.error('Error eliminando cuenta de usuario:', err);
      throw err;
    }
  };

  const updateUserData = async (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    saveUserProfile(updated);

    if (currentUser) {
      if (
        data.avatarUrl &&
        !data.avatarUrl.startsWith('data:') &&
        data.avatarUrl.length < 2000
      ) {
        try {
          await firebaseUpdateProfile(currentUser, { photoURL: data.avatarUrl });
        } catch (e) {
          console.warn('Error actualizando photoURL en Auth:', e);
        }
      }
      try {
        const updatePromise = setDoc(
          doc(db, 'users', currentUser.uid),
          {
            ...updated,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (e) {
        console.warn('Error actualizando perfil en Firestore (conservado en local):', e);
      }
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } finally {
      setLoading(false);
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth.currentUser) throw new Error('No user is currently authenticated.');
    setLoading(true);
    try {
      const cred = await linkWithPopup(auth.currentUser, googleProvider);
      if (cred.user) {
        setCurrentUser(cred.user);
        await updateUserData({ authProvider: 'google' });
      }
    } finally {
      setLoading(false);
    }
  };

  const changeUserPassword = async (newPass: string) => {
    if (!auth.currentUser) throw new Error('No user is currently authenticated.');
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, newPass);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isNewUserSignup,
        clearNewUserSignup,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        deleteUserAccount,
        updateUserData,
        resetPassword,
        linkGoogleAccount,
        changeUserPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
