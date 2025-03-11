import { usePos } from "@/lib/pos-context";
import { Link } from "wouter";
import { 
  ShoppingBag, 
  Clipboard, 
  BarChart, 
  Calendar, 
  Settings, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SideNavProps {
  activeModule: string;
}

export default function SideNav({ activeModule }: SideNavProps) {
  const { setActiveModule } = usePos();
  
  const modules = [
    { name: "sales", icon: ShoppingBag, label: "Sales" },
    { name: "inventory", icon: Clipboard, label: "Inventory" },
    { name: "reports", icon: BarChart, label: "Reports" },
    { name: "schedule", icon: Calendar, label: "Schedule" },
  ];

  return (
    <div className="bg-gradient-to-b from-primary to-primary/95 w-full lg:w-16 flex lg:flex-col items-center justify-between py-2 lg:py-6 px-4 lg:px-0 shadow-lg">
      <div className="flex lg:flex-col space-x-6 lg:space-x-0 lg:space-y-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.name}
              className={cn(
                "text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm",
                activeModule === module.name 
                  ? "bg-white/20 ring-2 ring-white/50 ring-opacity-50" 
                  : "hover:bg-white/10"
              )}
              onClick={() => setActiveModule(module.name)}
              aria-label={module.label}
              title={module.label}
            >
              <Icon className="h-6 w-6" />
            </button>
          );
        })}
      </div>
      
      {/* 고급스러운 구분선 */}
      <div className="hidden lg:block w-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-4"></div>
      
      <div className="flex lg:flex-col space-x-6 lg:space-x-0 lg:space-y-6">
        <Link href="/dashboard">
          <button 
            className="text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-white/10 shadow-sm"
            aria-label="대시보드"
            title="대시보드"
          >
            <LayoutDashboard className="h-6 w-6" />
          </button>
        </Link>
        
        {/* 고급스러운 구분선 */}
        <div className="hidden lg:block w-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-1"></div>
        
        <button 
          className="text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-white/10 shadow-sm"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>
        <button 
          className="text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-white/10 shadow-sm"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
