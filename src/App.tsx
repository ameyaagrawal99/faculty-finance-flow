import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsProvider } from "@/lib/settings-context";
import Calculator from "./pages/Calculator";
import Compare from "./pages/Compare";
import PayMatrix from "./pages/PayMatrix";
import Arrears from "./pages/Arrears";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <header className="h-12 flex items-center border-b bg-card px-2 shrink-0">
                  <SidebarTrigger className="ml-1" />
                  <span className="ml-3 text-sm font-semibold text-muted-foreground">
                    Faculty Salary Calculator
                  </span>
                </header>
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Calculator />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/pay-matrix" element={<PayMatrix />} />
                    <Route path="/arrears" element={<Arrears />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
