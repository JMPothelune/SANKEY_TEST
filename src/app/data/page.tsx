import { AppNavbar } from '@/components/ui/AppNavbar';

export default function DataPage() {
  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="flex-1 min-h-0">
        <iframe
          src="/data/index.html"
          className="w-full h-full border-0"
          title="Data"
        />
      </div>
    </div>
  );
}
