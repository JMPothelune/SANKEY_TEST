import { AppNavbar } from '@/components/ui/AppNavbar';

export default function SankeyPage() {
  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="flex-1 min-h-0" style={{ paddingTop: 64 }}>
        <iframe
          src="/sankey/index.html"
          className="w-full h-full border-0"
          title="Sankey"
        />
      </div>
    </div>
  );
}
