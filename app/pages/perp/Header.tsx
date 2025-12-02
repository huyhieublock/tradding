import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { WalletConnectButton } from "./WalletConnectButton";
import { Globe, MoreHorizontal, Eye, Menu, X } from "lucide-react"; // Thêm icon Menu, X
import { SymbolSelector } from "./SymbolSelector";

export const Header = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Trade");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Đồng bộ active tab với URL (optional)
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path.includes("/perp")) setActiveTab("Trade");
    else if (path.includes("/leaderboard")) setActiveTab("Leaderboard");
    // ... logic mapping khác
  }, [location]);

  const navItems = [
    { name: "Trade", path: "/" },
    { name: "Weather Index", path: "/weather" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Markets", path: "/markets" },
  ];

  // Khóa cuộn trang khi mở menu mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[56px] w-full items-center justify-between bg-[#0b0e11] px-4 border-b border-[#1f2229]">
        {/* --- LEFT SIDE --- */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* MOBILE: HAMBURGER MENU BUTTON */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center font-bold text-white text-lg md:text-xl tracking-wider">
              <span className="mr-1">OPEN</span>
              <span className="text-[#00E5AE]">PG</span>
            </div>
          </Link>

          {/* DESKTOP: NAVIGATION (Ẩn trên mobile) */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setActiveTab(item.name)}
                className={`
                  relative text-sm font-medium transition-colors py-[17px]
                  ${
                    activeTab === item.name
                      ? "text-[#00E5AE]"
                      : "text-[#808691] hover:text-white"
                  }
                `}
              >
                {item.name}
                {activeTab === item.name && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#00E5AE] shadow-[0_-2px_8px_rgba(0,229,174,0.6)]" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* --- RIGHT SIDE: ACTIONS --- */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Total Value (Chỉ hiện trên màn hình lớn) */}
          <div className="hidden xl:flex flex-col items-end mr-2 text-right">
            <div className="flex items-center gap-1 text-[11px] text-[#808691]">
              <span>Total value</span>
              <Eye className="w-3 h-3 cursor-pointer" />
              <span className="text-[10px]">≈</span>
            </div>
            <div className="flex items-center text-xs font-mono text-white">
              <span>****</span>
              <span className="ml-1 text-[#5e6673]">USDC</span>
            </div>
          </div>

          {/* Divider (Desktop only) */}
          <div className="hidden xl:block w-[1px] h-4 bg-[#2b303b] mx-1"></div>

          {/* Icons (Desktop only) */}
          <div className="hidden md:flex gap-1">
            <button className="text-[#808691] hover:text-white p-1.5 rounded-md hover:bg-[#1f2229] transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button className="text-[#808691] hover:text-white p-1.5 rounded-md hover:bg-[#1f2229] transition-colors">
              <Globe className="w-5 h-5" />
            </button>
          </div>

          {/* Symbol Selector (Coin) */}
          {/* Trên mobile có thể ẩn bớt text nếu cần, nhưng SymbolSelector hiện tại khá gọn */}
          <div className="scale-90 md:scale-100 origin-right">
            <SymbolSelector />
          </div>

          {/* Wallet Button */}
          <div className="scale-90 md:scale-100 origin-right">
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* --- MOBILE DRAWER (SLIDE-IN MENU) --- */}
      {/* Overlay Background */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer Content */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-[#111318] border-r border-[#1f2229] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1f2229]">
            <div className="flex items-center font-bold text-white text-lg tracking-wider">
              <span className="mr-1">OPEN</span>
              <span className="text-[#00E5AE]">PG</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1f2229]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="flex flex-col gap-1 px-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      setActiveTab(item.name);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                                    flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${
                                      activeTab === item.name
                                        ? "bg-[#00E5AE]/10 text-[#00E5AE]"
                                        : "text-gray-400 hover:bg-[#1f2229] hover:text-white"
                                    }
                                `}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Drawer Footer (Additional Actions) */}
          <div className="p-4 border-t border-[#1f2229] bg-[#0b0e11]">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs">Language</span>
              <div className="flex gap-4">
                <Globe className="w-5 h-5 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
