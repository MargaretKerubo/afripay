"use client";

import { useState, useEffect } from "react";
import { Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#problem", label: "Problem" },
    { href: "#solution", label: "Solution" },
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-950/90 backdrop-blur-md border-b border-gold-400/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gold-400 flex items-center justify-center animate-pulse-gold">
            <Zap size={16} className="text-navy-950" fill="currentColor" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight text-sand-100">
            Afri<span className="text-gold-gradient">Pay</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-sand-400 hover:text-sand-100 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#cta"
            className="px-5 py-2 rounded-full text-sm font-medium bg-gold-400 text-navy-950 hover:bg-gold-500 transition-colors duration-200"
          >
            Join Waitlist
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-sand-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy-900/95 backdrop-blur-md border-t border-gold-400/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sand-200 text-sm py-1"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            className="mt-2 px-5 py-2.5 rounded-full text-sm font-medium bg-gold-400 text-navy-950 text-center"
            onClick={() => setOpen(false)}
          >
            Join Waitlist
          </a>
        </div>
      )}
    </nav>
  );
}
