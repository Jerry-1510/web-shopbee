import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-24 md:pb-0">
        {children}
      </main>
      {!isAdminRoute && <MobileBottomNav />}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default Layout;



