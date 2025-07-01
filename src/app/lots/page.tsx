import { AppNavbar } from '@/components/ui/AppNavbar';

export default function LotsPage() {
  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="flex-1 min-h-0" style={{ paddingTop: 64 }}>
        <iframe
          src="/lot/index.html"
          className="w-full h-full border-0"
          title="Lots"
        />
      </div>
    </div>
  );
}
