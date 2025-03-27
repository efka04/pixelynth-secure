// Implémentation de rate limiting en mémoire (sans Redis)
// Cette version utilise une Map en mémoire pour stocker les données de limitation

// Classe pour gérer le stockage en mémoire des données de limitation
class MemoryStore {
  constructor() {
    this.store = new Map();
    // Nettoyer les entrées expirées toutes les minutes
    setInterval(() => this.cleanup(), 60000);
  }

  // Nettoyer les entrées expirées
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.reset < now) {
        this.store.delete(key);
      }
    }
  }

  // Incrémenter le compteur pour une clé donnée
  async increment(key, windowMs) {
    const now = Date.now();
    const reset = now + windowMs;
    
    if (!this.store.has(key)) {
      this.store.set(key, { count: 1, reset });
      return { count: 1, reset };
    }
    
    const data = this.store.get(key);
    
    // Si la fenêtre est expirée, réinitialiser le compteur
    if (data.reset < now) {
      this.store.set(key, { count: 1, reset });
      return { count: 1, reset };
    }
    
    // Sinon, incrémenter le compteur
    data.count += 1;
    return { count: data.count, reset: data.reset };
  }
}

// Classe pour gérer la limitation de débit
class MemoryRatelimit {
  constructor(options) {
    this.store = new MemoryStore();
    this.limit = options.limit || 10;
    this.windowMs = options.windowMs || 60000; // 1 minute par défaut
    this.prefix = options.prefix || 'ratelimit';
  }

  // Vérifier si une requête dépasse la limite
  async limit(identifier) {
    const key = `${this.prefix}:${identifier}`;
    const { count, reset } = await this.store.increment(key, this.windowMs);
    
    const remaining = Math.max(0, this.limit - count);
    const success = count <= this.limit;
    
    return {
      success,
      limit: this.limit,
      remaining,
      reset: Math.ceil((reset - Date.now()) / 1000) // Convertir en secondes
    };
  }

  // Méthode statique pour créer un limiteur avec fenêtre glissante
  static slidingWindow(limit, window) {
    // Convertir la chaîne de fenêtre (ex: "60 s") en millisecondes
    let windowMs = 60000; // Par défaut 1 minute
    
    if (typeof window === 'string') {
      const parts = window.split(' ');
      if (parts.length === 2) {
        const value = parseInt(parts[0], 10);
        const unit = parts[1].toLowerCase();
        
        switch (unit) {
          case 's':
            windowMs = value * 1000;
            break;
          case 'm':
            windowMs = value * 60 * 1000;
            break;
          case 'h':
            windowMs = value * 60 * 60 * 1000;
            break;
          case 'd':
            windowMs = value * 24 * 60 * 60 * 1000;
            break;
        }
      }
    }
    
    return { limit, windowMs };
  }
}

// Créer différents limiteurs pour différentes routes
export const authLimiter = new MemoryRatelimit({
  limit: 5,
  windowMs: 60 * 1000, // 60 secondes
  prefix: "ratelimit:auth",
});

export const apiLimiter = new MemoryRatelimit({
  limit: 20,
  windowMs: 60 * 1000, // 60 secondes
  prefix: "ratelimit:api",
});

// Fonction d'aide pour appliquer le rate limiting
export async function applyRateLimit(request, limiter) {
  // Utiliser l'IP comme identifiant (ou l'ID utilisateur si disponible)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  return { 
    success, 
    limit, 
    reset, 
    remaining,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString()
    }
  };
}
