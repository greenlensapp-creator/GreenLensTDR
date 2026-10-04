import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Redimensiona y comprime una imagen seleccionada por el usuario
 * para optimizar la velocidad de carga y mantener máxima nitidez en el avatar.
 */
export async function processAndCompressImage(file: File, maxSize = 400): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de imagen.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Error al procesar el archivo de imagen.'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de la galería.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube la fotografía de perfil a Firebase Storage en la ruta:
 * users/{uid}/profile/profile-photo
 * Sustituye limpiamente cualquier foto anterior.
 * En caso de que Storage no tenga permisos o no esté disponible,
 * devuelve el dataURL comprimido como respaldo garantizado.
 */
export async function uploadUserProfilePhoto(uid: string, file: File): Promise<string> {
  const { blob, dataUrl } = await processAndCompressImage(file);

  try {
    const photoRef = ref(storage, `users/${uid}/profile/profile-photo`);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        updatedAt: new Date().toISOString(),
        ownerUid: uid
      }
    };

    const uploadPromise = (async () => {
      await uploadBytes(photoRef, blob, metadata);
      return await getDownloadURL(photoRef);
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Storage timeout')), 5000);
    });

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Subida a Firebase Storage no completada o agotado tiempo, utilizando formato optimizado seguro:', storageError);
    // Retornamos el dataUrl optimizado para que el usuario nunca pierda su foto y no se quede cargando
    return dataUrl;
  }
}
