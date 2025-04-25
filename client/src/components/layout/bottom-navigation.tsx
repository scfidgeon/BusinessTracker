import { Link, useLocation } from "wouter";
import { Home, Users, Receipt, Settings } from "lucide-react";

const BottomNavigation = () => {
  const [location] = useLocation();
  
  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Clients",
      path: "/clients",
      icon: Users,
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: Receipt,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 h-20">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-1/4 h-full ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
