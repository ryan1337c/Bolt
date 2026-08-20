"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { Settings } from "lucide-react";

import { AuthServices } from "@/lib/authServices";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const placementClasses = {
  "top-left":
    "bottom-full left-0 mb-2 w-60 origin-bottom p-3",
  "bottom-right":
    "top-full right-0 mt-3 w-64 origin-top-right p-2",
} as const;

type ProfileMenuPlacement = keyof typeof placementClasses;

type ProfileMenuItemsProps = {
  onSettingsClick: () => void;
  onLogout?: () => void;
  disabled?: boolean;
};

export function ProfileMenuItems({
  onSettingsClick,
  onLogout,
  disabled = false,
}: ProfileMenuItemsProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const auth = new AuthServices();
    await auth.logout();
    onLogout?.();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <ThemeToggle />
      <button
        type="button"
        onClick={onSettingsClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md transition-colors disabled:opacity-50"
      >
        <Settings size={16} />
        <span>Settings</span>
      </button>
      <hr className="border-slate-200 dark:border-slate-700 my-1" />
      <button
        type="button"
        onClick={handleLogout}
        disabled={disabled}
        className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
        <span>Sign Out</span>
      </button>
    </>
  );
}

type ProfileMenuProps = {
  children: ReactNode;
  onSettingsClick: () => void;
  triggerClassName: string;
  placement?: ProfileMenuPlacement;
  disabled?: boolean;
  showHoverHint?: boolean;
};

export default function ProfileMenu({
  children,
  onSettingsClick,
  triggerClassName,
  placement = "bottom-right",
  disabled = false,
  showHoverHint = false,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${showHoverHint ? "group" : ""}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled}
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        className={triggerClassName}
      >
        {children}
      </button>

      {showHoverHint && !isOpen && (
        <div className="absolute top-full right-0 mt-1 w-max text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 group-hover:delay-500 pointer-events-none bg-white text-slate-700 dark:bg-slate-800 dark:text-white">
          Open profile menu
          <div className="absolute bottom-full right-4 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-white dark:border-b-slate-800"></div>
        </div>
      )}

      <div
        className={`absolute z-50 border rounded-lg shadow-xl flex flex-col gap-1 transition-all duration-300 ease-out bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 ${placementClasses[placement]} ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <ProfileMenuItems
          disabled={disabled}
          onSettingsClick={() => {
            setIsOpen(false);
            onSettingsClick();
          }}
        />
      </div>
    </div>
  );
}
