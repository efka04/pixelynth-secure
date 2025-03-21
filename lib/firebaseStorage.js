import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

export async function uploadImageWithCache(file) {
  // Crée une référence dans Firebase Storage pour stocker l'image
  const storageRef = ref(storage, `images/${file.name}`);

  // Définit les métadonnées pour la mise en cache et le type de contenu
  const metadata = {
    cacheControl: 'public, max-age=31536000', // Cache pendant 1 an
    contentType: file.type,                   // Par exemple : image/jpeg
  };

  // Démarre l'upload avec les métadonnées
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // On désactive ESLint pour ce callback car on n'utilise pas le paramètre
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      () => {},
      (error) => {
        console.error("Erreur d'upload :", error);
        reject(error);
      },
      () => {
        // Une fois l'upload terminé, récupère l'URL de téléchargement
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            console.log("URL de l'image :", downloadURL);
            resolve(downloadURL);
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération de l'URL :", error);
            reject(error);
          });
      }
    );
  });
}
