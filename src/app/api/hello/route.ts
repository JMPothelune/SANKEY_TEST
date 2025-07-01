export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: 'Hello depuis l’API Next.js sur Vercel !' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 