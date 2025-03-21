export async function GET() {
    const posts = [
        {
            id: 1,
            title: "Article 1",
            // ...other properties...
            color: "blue", // Add color property to each post
        },
        // ...other posts with their respective colors...
    ];

    return Response.json(posts);
}
