import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
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
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-transparent">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 h-14 flex items-center justify-between border-b border-border/60 bg-background/90 px-3 md:px-5 backdrop-blur-xl shrink-0">
                  <div className="flex items-center">
                    <SidebarTrigger className="ml-1" />
                    <div className="ml-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Faculty Finance Flow</p>
                      <h1 className="text-sm md:text-base font-semibold">Salary Planning Workspace</h1>
                    </div>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
                    UGC 7th CPC Ready
                  </Badge>
                </header>
                <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
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
