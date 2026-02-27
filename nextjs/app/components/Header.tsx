"use client";
import { useState } from "react";
import Link from "next/link";
import { QrCode, Key, Menu, X } from "lucide-react";
import ActivationDialog from "./ActivationDialog";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-[#dde2ff] dark:border-[#312e81] bg-white/80 dark:bg-[#0f0e1a]/80 backdrop-blur sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <QrCode size={26} className="text-brand-500 dark:text-brand-300" />
            <span className="font-bold text-lg text-brand-600 dark:text-brand-300">HoverQR</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
            >
              Pricing
            </Link>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors inline-flex items-center gap-1"
            >
              <Key size={14} /> My Key
            </button>
            <ThemeToggle />
            <Link
              href="/pricing"
              className="bg-brand-gradient text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Pro
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#dde2ff] dark:border-[#312e81] bg-white dark:bg-[#0f0e1a] px-4 py-3 flex flex-col gap-3 text-sm transition-colors">
            <Link
              href="/pricing"
              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors py-1"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <button
              onClick={() => {
                setDialogOpen(true);
                setMenuOpen(false);
              }}
              className="text-left text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors py-1 inline-flex items-center gap-1"
            >
              <Key size={14} /> My Key
            </button>
            <Link
              href="/pricing"
              className="text-center bg-brand-gradient text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              onClick={() => setMenuOpen(false)}
            >
              Get Pro
            </Link>
          </div>
        )}
      </nav>

      <ActivationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
