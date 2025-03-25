// Fonctions de validation réutilisables
export const validators = {
    // Valider le titre
    title: (value) => {
      if (!value || typeof value !== 'string') return 'Title is required';
      if (value.trim().length < 3) return 'Title must be at least 3 characters';
      if (value.trim().length > 40) return 'Title must be 40 characters or less';
      return null;
    },
    
    // Valider la description
    description: (value) => {
      if (!value || typeof value !== 'string') return 'Description is required';
      if (value.trim().length < 10) return 'Description must be at least 10 characters';
      if (value.trim().length > 300) return 'Description must be 300 characters or less';
      return null;
    },
    
    // Valider les catégories
    categories: (value) => {
      if (!Array.isArray(value) || value.length === 0) return 'At least one category is required';
      if (value.length > 5) return 'Maximum 5 categories allowed';
      return null;
    },
    
    // Valider les tags
    tags: (value) => {
      if (!Array.isArray(value)) return 'Tags must be an array';
      if (value.length > 20) return 'Maximum 20 tags allowed';
      
      // Vérifier chaque tag
      for (const tag of value) {
        if (typeof tag !== 'string') return 'Tags must be strings';
        if (tag.length > 30) return 'Tags must be 30 characters or less';
      }
      return null;
    },
    
    // Valider la couleur
    color: (value) => {
      if (!value || value === 'white') return 'Please select a color';
      return null;
    }
  };
  
  // Fonction pour valider un objet complet
  export function validateImageData(data) {
    const errors = {};
    
    // Valider chaque champ
    const titleError = validators.title(data.title);
    if (titleError) errors.title = titleError;
    
    const descError = validators.description(data.desc);
    if (descError) errors.desc = descError;
    
    const categoriesError = validators.categories(data.categories);
    if (categoriesError) errors.categories = categoriesError;
    
    const tagsError = validators.tags(data.tags);
    if (tagsError) errors.tags = tagsError;
    
    const colorError = validators.color(data.color);
    if (colorError) errors.color = colorError;
    
    // Vérifier si l'objet d'erreurs est vide
    return Object.keys(errors).length > 0 ? errors : null;
  }
  
  // Fonction pour sanitiser les données
  export function sanitizeImageData(data) {
    return {
      ...data,
      title: data.title ? data.title.trim().slice(0, 40) : '',
      desc: data.desc ? data.desc.trim().slice(0, 300) : '',
      lowercaseTitle: data.title ? data.title.trim().toLowerCase().slice(0, 40) : '',
      lowercaseDesc: data.desc ? data.desc.trim().toLowerCase().slice(0, 300) : '',
      tags: Array.isArray(data.tags) 
        ? data.tags
            .filter(tag => typeof tag === 'string')
            .map(tag => tag.trim().slice(0, 30))
            .filter(tag => tag.length > 0)
        : [],
      categories: Array.isArray(data.categories)
        ? data.categories.slice(0, 5)
        : [],
    };
  }
  