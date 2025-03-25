import { NextResponse } from 'next/server';
import { apiLimiter, applyRateLimit } from '../config/ratelimit';

export async function GET(request) {
    // Appliquer le rate limiting
    const rateLimit = await applyRateLimit(request, apiLimiter);
    
    if (!rateLimit.success) {
        return new NextResponse(
            JSON.stringify({ error: "Too many requests" }),
            { 
                status: 429,
                headers: rateLimit.headers
            }
        );
    }
    
    // Code existant pour récupérer les posts
    const posts = [
        {
            id: 1,
            title: "Article 1",
            // ...other properties...
            color: "blue",
        },
        // ...other posts
    ];

    return NextResponse.json(posts, { 
        headers: rateLimit.headers 
    });
}
