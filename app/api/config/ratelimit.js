import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Créer une instance Redis (utiliser vos propres identifiants Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Créer différents limiteurs pour différentes routes
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requêtes par minute
  analytics: true,
  prefix: "ratelimit:auth",
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 requêtes par minute
  analytics: true,
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
