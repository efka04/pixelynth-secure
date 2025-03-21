'use client';

/**
 * Extrait des tags potentiels à partir du titre et de la description
 * @param {string} title - Titre du post
 * @param {string} description - Description du post
 * @param {Array} existingTags - Tags déjà ajoutés manuellement
 * @param {number} maxTags - Nombre maximum de tags autorisés (défaut: 20)
 * @returns {Array} - Liste combinée de tags (existants + extraits)
 */
export const extractTagsFromText = (title = '', description = '', existingTags = [], maxTags = 20) => {
  // Vérifier si nous avons déjà atteint le nombre maximum de tags
  if (existingTags.length >= maxTags) {
    return existingTags;
  }

  // Combiner le titre et la description pour l'analyse
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Nettoyer le texte et le diviser en mots
  const words = combinedText
    .replace(/[^\w\s]/g, ' ') // Remplacer les caractères spéciaux par des espaces
    .replace(/\s+/g, ' ')     // Remplacer les espaces multiples par un seul espace
    .trim()
    .split(' ');
  
  // Filtrer les mots pour trouver des tags potentiels
  const potentialTags = words
    .filter(word => {
      // Ignorer les mots courts (moins de 3 caractères)
      if (word.length < 3) return false;
      
      // Ignorer les mots communs (articles, prépositions, etc.)
      const commonWords = [
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has',
        'are', 'not', 'but', 'what', 'all', 'was', 'were', 'they', 'their',
        'when', 'will', 'who', 'how', 'where', 'which', 'there', 'been',
        'les', 'des', 'une', 'pour', 'dans', 'avec', 'sur', 'par', 'est',
        'sont', 'vous', 'nous', 'ils', 'elles', 'mais', 'donc', 'car', 'que'
      ];
      
      return !commonWords.includes(word);
    })
    .filter(word => !existingTags.includes(word)) // Éviter les doublons avec les tags existants
    .slice(0, maxTags - existingTags.length);     // Limiter au nombre maximum de tags autorisés
  
  // Combiner les tags existants avec les nouveaux tags extraits
  return [...existingTags, ...potentialTags];
};

/**
 * Applique l'extraction de tags à un objet imageData
 * @param {Object} imageData - Données de l'image à modifier
 * @returns {Object} - Données de l'image avec tags mis à jour
 */
export const enhanceImageDataWithTags = (imageData) => {
  if (!imageData) return imageData;
  
  // Extraire des tags à partir du titre et de la description
  const enhancedTags = extractTagsFromText(
    imageData.title,
    imageData.desc,
    imageData.tags || [],
    20 // Limite maximale de tags
  );
  
  // Mettre à jour les tags dans l'objet imageData
  return {
    ...imageData,
    tags: enhancedTags
  };
};
