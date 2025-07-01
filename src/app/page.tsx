import { AppNavbar } from '@/components/ui/AppNavbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100/60 to-white font-sans px-2">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center w-full pt-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-700">
              Prototypes Valoramix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 w-full">
              <Link
                href="/lots"
                className="block w-full text-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition"
              >
                Lots
              </Link>
              <Link
                href="/sankey"
                className="block w-full text-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold text-lg shadow hover:bg-green-700 transition"
              >
                Sankey
              </Link>
              <Link
                href="/api_test"
                className="block w-full text-center px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold text-lg shadow hover:bg-purple-700 transition"
              >
                Test API
              </Link>
              <Link
                href="/data"
                className="block w-full text-center px-6 py-3 rounded-lg bg-gray-600 text-white font-semibold text-lg shadow hover:bg-gray-700 transition"
              >
                Données
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
