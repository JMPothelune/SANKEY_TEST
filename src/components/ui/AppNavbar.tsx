import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

export function AppNavbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-100 h-16 flex items-center">
      <div className="w-full mx-auto flex items-center h-full justify-between px-4">
        <NavigationMenu className="h-full">
          <NavigationMenuList className="h-full">
            <NavigationMenuItem className="h-full flex items-center">
              <NavigationMenuLink
                href="../"
                className="px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-md transition h-10 flex items-center"
              >
                ← Retour
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <NavigationMenu className="h-full">
          <NavigationMenuList className="h-full flex items-center gap-2">
            <NavigationMenuItem className="h-full flex items-center">
              <NavigationMenuLink
                href="/api_test"
                className="px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-md transition h-10 flex items-center"
              >
                Test API
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="h-full flex items-center">
              <NavigationMenuLink
                href="/sankey"
                className="px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-md transition h-10 flex items-center"
              >
                Sankey
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="h-full flex items-center">
              <NavigationMenuLink
                href="/lots"
                className="px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-md transition h-10 flex items-center"
              >
                Lots
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
