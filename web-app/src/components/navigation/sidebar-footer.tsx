"use client"

import Link from "next/link"
import { Twitter, Send, MessageCircle } from "lucide-react"

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Send, href: "https://telegram.org", label: "Telegram" },
  { icon: MessageCircle, href: "https://discord.com", label: "Discord" },
]

const footerLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact Us", href: "/contact" },
]

export function SidebarFooter() {
  return (
    <div className="border-t border-gray-400 p-6 space-y-4">
      {/* Social Links */}
      <div className="flex gap-3 justify-center">
        {socialLinks.map((social) => {
          const Icon = social.icon
          return (
            <Link
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 transition-colors"
              aria-label={social.label}
            >
              <Icon className="h-5 w-5 text-gray-600" />
            </Link>
          )
        })}
      </div>

      {/* Footer Links */}
      <div className="space-y-1 text-center">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-xs text-gray-600 hover:text-[#00EF8C] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
