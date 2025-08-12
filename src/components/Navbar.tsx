"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

interface NavbarProps {
  variant?: "landing" | "dashboard" | "leaderboard";
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backButtonText?: string;
}

export default function Navbar({
  variant = "landing",
  title,
  subtitle,
  showBackButton = false,
  backUrl = "/dashboard",
  backButtonText = "Back to Dashboard",
}: NavbarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getLogo = () => {
    switch (variant) {
      case "dashboard":
      case "leaderboard":
        return "/PurpleLogo2.svg";
      case "landing":
      default:
        return "/ShineLogo2.svg";
    }
  };

  const getLogoSize = () => {
    switch (variant) {
      case "dashboard":
      case "leaderboard":
        return { width: 130, height: 20, className: " sm:min-w-[130px] max-sm:w-[100px]" };
      case "landing":
      default:
        return { width: 130, height: 20, className: " sm:min-w-[130px] max-sm:w-[100px]" };
    }
  };

  const getBackground = () => {
    switch (variant) {
      case "landing":
        return "bg-white/80  backdrop-blur-sm border-b border-gray-200  sticky top-0 z-50";
      case "dashboard":
      case "leaderboard":
      default:
        return "bg-white  shadow-sm border-b border-gray-200 ";
    }
  };

  const logoSize = getLogoSize();

  return (
    <header className={getBackground() + " w-full"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src={getLogo()}
                alt="Logo"
                width={logoSize.width}
                height={logoSize.height}
                className={logoSize.className}
              />
              {title && (
                <div>
                  <h1 className="text-xl font-bold text-gray-900 ">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 ">{subtitle}</p>
                  )}
                </div>
              )}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {showBackButton ? (
             <> <Link href={backUrl}>
                <Button className="max-sm:text-xs" variant="purpleOutline" size="sm">
                  {backButtonText}
                </Button>
              </Link>
             {user && (
              <Button 
                variant="purple" 
                className="max-sm:text-xs"
                size="sm"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
              >
                Sign Out
              </Button>
            )}
            </>
            ) : variant === "landing" ? (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button variant="primary" className="max-sm:text-xs" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button variant="primary" className="max-sm:text-xs" size="sm">
                      Join Waitlist
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/leaderboard">
                  <Button variant="purpleOutline" className="max-sm:text-xs" size="sm">
                    View Leaderboard
                  </Button>
                </Link>
                {user && (
                  <Button 
                    variant="purple" 
                    className="max-sm:text-xs"
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      router.push('/');
                    }}
                  >
                    Sign Out
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 