"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/app/context/AuthContext";
import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";
import type { UsageSnapshot } from "@/lib/credits/types";
import {
  fetchUsageSnapshot,
  formatCreditReset,
} from "@/lib/credits/usageClient";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
};

export type SettingsSection = "general" | "billing" | "account";
type AccountDialog = "name" | "delete" | null;

const sections = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "account", label: "Account", icon: UserRound },
] satisfies Array<{
  id: SettingsSection;
  label: string;
  icon: typeof Settings2;
}>;

const themes = [
  { id: "system", label: "System" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
] as const;

type BillingSummary = {
  tier: string;
  tier_expires_at: string | null;
  source_subscription_id: string | null;
  status?: string;
  cancel_at_period_end?: boolean;
};

const authServices = new AuthServices();
const publicServices = new PublicServices();


export default function SettingsModal({
  isOpen,
  onClose,
  initialSection = "general",
}: SettingsModalProps) {
  const { tier } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(initialSection);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isDictationEnabled, setIsDictationEnabled] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [billingSummary, setBillingSummary] =
    useState<BillingSummary | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [accountDialog, setAccountDialog] = useState<AccountDialog>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [hasConfirmedDataDeletion, setHasConfirmedDataDeletion] =
    useState(false);
  const [hasConfirmedIrreversible, setHasConfirmedIrreversible] =
    useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsDictationEnabled(
      window.localStorage.getItem("dictation-enabled") !== "false",
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [initialSection, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isUpgradeOpen) {
        setIsUpgradeOpen(false);
      } else if (isCancelConfirmOpen) {
        setIsCancelConfirmOpen(false);
      } else if (accountDialog) {
        setAccountDialog(null);
      } else if (isThemeMenuOpen) {
        setIsThemeMenuOpen(false);
      } else {
        onClose();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [
    accountDialog,
    isCancelConfirmOpen,
    isOpen,
    isThemeMenuOpen,
    isUpgradeOpen,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen || activeSection !== "billing" || !tier || tier === "free") {
      return;
    }

    let isCurrent = true;
    setIsBillingLoading(true);

    authServices
      .getSession()
      .then((session) => publicServices.getBillingSummary(session.user.id))
      .then((summary) => {
        if (isCurrent) setBillingSummary(summary);
      })
      .catch((error) => {
        console.error("Unable to load billing details:", error);
      })
      .finally(() => {
        if (isCurrent) setIsBillingLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen, tier]);

  useEffect(() => {
    if (!isOpen || activeSection !== "billing") {
      return;
    }

    let isCurrent = true;
    setIsUsageLoading(true);
    setUsageError("");

    authServices
      .getSession()
      .then((session) => fetchUsageSnapshot(session.access_token))
      .then((snapshot) => {
        if (isCurrent) setUsage(snapshot);
      })
      .catch((error) => {
        console.error("Unable to load usage:", error);
        if (isCurrent) {
          setUsage(null);
          setUsageError("Unable to load usage");
        }
      })
      .finally(() => {
        if (isCurrent) setIsUsageLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen]);

  useEffect(() => {
    if (!isOpen || activeSection !== "account") return;

    let isCurrent = true;
    setIsAccountLoading(true);

    authServices
      .getSession()
      .then((session) => {
        if (!isCurrent) return;

        const metadata = session.user.user_metadata;
        const fullName =
          metadata.full_name ||
          metadata.name ||
          [metadata.firstName, metadata.lastName].filter(Boolean).join(" ");

        setAccountName(fullName || "Not provided");
        setAccountEmail(session.user.email ?? "Not provided");
      })
      .catch((error) => {
        console.error("Unable to load account details:", error);
      })
      .finally(() => {
        if (isCurrent) setIsAccountLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeSection, isOpen]);

  const toggleDictation = () => {
    const nextValue = !isDictationEnabled;
    setIsDictationEnabled(nextValue);
    window.localStorage.setItem("dictation-enabled", String(nextValue));
    window.dispatchEvent(
      new CustomEvent("dictation-setting-change", { detail: nextValue }),
    );
  };

  const cancelSubscription = async () => {
    setIsCancelling(true);
    setCancellationError("");

    try {
      const session = await authServices.getSession();
      const response = await fetch("/api/stripe/cancel_subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to cancel subscription");
      }

      setBillingSummary((summary) =>
        summary
          ? {
              ...summary,
              cancel_at_period_end: true,
              tier_expires_at: data.currentPeriodEnd ?? summary.tier_expires_at,
            }
          : summary,
      );
      setIsCancelConfirmOpen(false);
    } catch (error) {
      setCancellationError(
        error instanceof Error
          ? error.message
          : "Unable to cancel subscription",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const startCheckout = async (plan: "pro_monthly" | "pro_yearly") => {
    setIsCheckoutLoading(true);
    setCheckoutError("");

    try {
      const session = await authServices.getSession();
      const response = await fetch("/api/stripe/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start checkout");
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout",
      );
      setIsCheckoutLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setIsPortalLoading(true);
    setPortalError("");

    try {
      const session = await authServices.getSession();
      const response = await fetch("/api/stripe/create_portal_session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Unable to open billing portal";
        throw new Error(message);
      }

      window.location.assign(data.url);
    } catch (error) {
      setPortalError(
        error instanceof Error
          ? error.message
          : "Unable to open billing portal",
      );
      setIsPortalLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError("");

    try {
      const session = await authServices.getSession();
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
      )

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete account");
      }

      await authServices.logout();
      window.location.assign("/");
    }
    catch (error) {
      setDeleteAccountError(
        error instanceof Error
          ? error.message
          : "Unable to delete account",
      );
    }
    finally {
      setIsDeletingAccount(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-[min(38rem,85vh)] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <aside className="w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:w-60">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2
                size={19}
                className="text-violet-600 dark:text-purple-400"
              />
              <h2
                id="settings-title"
                className="font-semibold text-slate-900 dark:text-white"
              >
                Settings
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={17} />
            </button>
          </div>

          <nav aria-label="Settings sections" className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-100 text-violet-800 dark:bg-purple-400/15 dark:text-purple-200"
                      : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div
          className="min-w-0 flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900"
          aria-label={`${activeSection} settings`}
        >
          {activeSection === "general" && (
            <div className="mx-auto w-full max-w-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                General
              </h3>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

              {tier === "free" && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Do more with Omni
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Get higher limits and access advanced features.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutError("");
                      setIsUpgradeOpen(true);
                    }}
                    className="flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:-translate-y-0.5"
                  >
                    <Sparkles size={15} />
                    Upgrade
                  </button>
                </div>
              )}

              <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                <div className="flex min-h-14 items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Appearance
                  </span>

                  <div ref={themeMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsThemeMenuOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={isThemeMenuOpen}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium capitalize text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      {isMounted ? theme ?? "system" : "System"}
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${
                          isThemeMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isThemeMenuOpen && (
                      <div
                        role="listbox"
                        aria-label="Appearance"
                        className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                      >
                        {themes.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            role="option"
                            aria-selected={theme === id}
                            onClick={() => {
                              setTheme(id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              theme === id
                                ? "bg-violet-50 font-semibold text-violet-700 dark:bg-purple-400/10 dark:text-purple-300"
                                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                            }`}
                          >
                            {label}
                            {theme === id && <Check size={15} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-h-16 items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Enable Dictation
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Use speech-to-text when composing a message.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDictationEnabled}
                    onClick={toggleDictation}
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                      isDictationEnabled
                        ? "bg-violet-600 dark:bg-purple-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        isDictationEnabled
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="mx-auto w-full max-w-xl">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Billing &amp; Plan
              </h3>
              <p className="mt-1 pr-8 text-sm text-slate-500 dark:text-slate-400">
                Manage your plan, usage, and billing details.
              </p>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

              {!tier ? (
                <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ) : (
                <div className="space-y-6 pt-5">
                  {tier === "free" ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 pr-6">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Omni Free
                        </p>
                        <p className="mt-1 pr-4 text-xs text-slate-500 dark:text-slate-400">
                          Essential tools for everyday tasks
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutError("");
                          setIsUpgradeOpen(true);
                        }}
                        className="flex-shrink-0 rounded-full border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-500 hover:bg-violet-50 dark:border-purple-400/40 dark:text-purple-300 dark:hover:bg-purple-400/10"
                      >
                        Upgrade
                      </button>
                    </div>
                  ) : (
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Current Plan
                      </h4>
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        {isBillingLoading ? (
                          <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                        ) : (
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 pr-6">
                                <p className="font-semibold capitalize text-slate-900 dark:text-white">
                                  Omni {billingSummary?.tier ?? tier}
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  {billingSummary?.cancel_at_period_end
                                    ? billingSummary.tier_expires_at
                                      ? `Access continues until ${new Date(
                                          billingSummary.tier_expires_at,
                                        ).toLocaleDateString(undefined, {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric",
                                        })}`
                                      : "Your subscription will cancel at the end of the current period"
                                    : billingSummary?.tier_expires_at
                                      ? `Current period ends ${new Date(
                                          billingSummary.tier_expires_at,
                                        ).toLocaleDateString(undefined, {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric",
                                        })}`
                                      : "Your subscription is active"}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  billingSummary?.cancel_at_period_end
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                                }`}
                              >
                                {billingSummary?.cancel_at_period_end
                                  ? billingSummary.tier_expires_at
                                    ? `Cancels ${new Date(
                                        billingSummary.tier_expires_at,
                                      ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })}`
                                    : "Cancelling"
                                  : "Active"}
                              </span>
                            </div>

                            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellationError("");
                                  setIsCancelConfirmOpen(true);
                                }}
                                disabled={
                                  isCancelling ||
                                  billingSummary?.cancel_at_period_end
                                }
                                className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10 dark:disabled:border-slate-600 dark:disabled:text-slate-500"
                              >
                                {billingSummary?.cancel_at_period_end
                                  ? "Cancellation scheduled"
                                  : isCancelling
                                    ? "Cancelling..."
                                    : "Cancel subscription"}
                              </button>
                            </div>

                            {cancellationError && (
                              <p
                                role="alert"
                                className="mt-2 text-right text-xs text-red-600 dark:text-red-400"
                              >
                                {cancellationError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {usage?.period === "day" ||
                      (!usage && tier === "free")
                        ? "Usage today"
                        : "Usage this month"}
                    </h4>
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      {isUsageLoading ? (
                        <div className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                      ) : usageError ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {usageError}
                        </p>
                      ) : usage ? (
                        <div>
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {usage.used} / {usage.limit} credits
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {usage.remaining} remaining
                            </p>
                          </div>
                          <div
                            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={usage.limit}
                            aria-valuenow={Math.min(usage.used, usage.limit)}
                            aria-label="Credit usage"
                          >
                            <div
                              className="h-full rounded-full bg-violet-600 dark:bg-purple-500"
                              style={{
                                width: `${
                                  usage.limit === 0
                                    ? 0
                                    : Math.min(
                                        100,
                                        (usage.used / usage.limit) * 100,
                                      )
                                }%`,
                              }}
                            />
                          </div>
                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                            Resets {formatCreditReset(usage.resetsAt, usage.period)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Usage is unavailable.
                        </p>
                      )}
                    </div>
                  </section>

                  {tier !== "free" && (
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Billing details
                      </h4>
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          Payment methods and invoices
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Manage your subscription, update your card, or view receipts securely through
                          Stripe.
                        </p>

                        <button
                          type="button"
                          onClick={openBillingPortal}
                          disabled={isPortalLoading}
                          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                          {isPortalLoading ? "Opening..." : "Manage billing"}
                        </button>

                        {portalError && (
                          <p
                            role="alert"
                            className="mt-3 text-xs text-red-600 dark:text-red-400"
                          >
                            {portalError}
                          </p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === "account" && (
            <div className="mx-auto w-full max-w-xl">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Account
              </h3>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700" />

              {isAccountLoading ? (
                <div className="mt-5 space-y-3">
                  <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(
                        accountName === "Not provided" ? "" : accountName,
                      );
                      setNameError("");
                      setAccountDialog("name");
                    }}
                    className="flex min-h-14 w-full items-center justify-between gap-8 py-3 text-left transition-colors hover:text-violet-700 dark:hover:text-purple-300"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Name
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                        {accountName}
                      </span>
                      <ChevronRight
                        size={16}
                        className="flex-shrink-0 text-slate-400"
                      />
                    </span>
                  </button>

                  <div className="flex min-h-14 items-center justify-between gap-8 py-3">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Email
                    </span>
                    <span className="truncate text-right text-sm text-slate-600 dark:text-slate-300">
                      {accountEmail}
                    </span>
                  </div>

                  <div className="flex min-h-16 items-center justify-between gap-6 py-3">
                    <div className="pr-6">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Delete account
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Permanently delete your account and data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHasConfirmedDataDeletion(false);
                        setHasConfirmedIrreversible(false);
                        setDeleteAccountError("");
                        setAccountDialog("delete");
                      }}
                      className="flex-shrink-0 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-400/60 dark:text-red-300 dark:hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isUpgradeOpen && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsUpgradeOpen(false);
              }
            }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl dark:border-purple-400/20 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setIsUpgradeOpen(false)}
                aria-label="Close upgrade dialog"
                className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
              <div className="px-7 pb-7 pt-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                  <Sparkles size={25} />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-purple-300">
                  Omni Pro
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  Choose your billing cycle
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Unlock all premium features and get four times the Free usage
                  limit.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => startCheckout("pro_monthly")}
                    disabled={isCheckoutLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCheckoutLoading ? "Redirecting..." : "Subscribe monthly"}
                    {!isCheckoutLoading && <ArrowRight size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => startCheckout("pro_yearly")}
                    disabled={isCheckoutLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:-translate-y-0.5 hover:border-violet-500 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-400/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-400/10"
                  >
                    {isCheckoutLoading ? "Redirecting..." : "Subscribe yearly"}
                    {!isCheckoutLoading && <ArrowRight size={16} />}
                  </button>
                </div>

                {checkoutError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-red-600 dark:text-red-400"
                  >
                    {checkoutError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isCancelConfirmOpen && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isCancelling) {
                setIsCancelConfirmOpen(false);
              }
            }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={isCancelling}
                aria-label="Close cancel subscription dialog"
                className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="p-6 pt-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-8 ring-amber-50 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/5">
                  <AlertTriangle size={28} strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
                  Cancel subscription?
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Cancel your subscription at the end of the current billing
                  period?
                </p>

                {cancellationError && (
                  <p
                    role="alert"
                    className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    {cancellationError}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(false)}
                    disabled={isCancelling}
                    className="order-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10 sm:order-1"
                  >
                    Keep subscription
                  </button>
                  <button
                    type="button"
                    onClick={cancelSubscription}
                    disabled={isCancelling}
                    className="order-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none dark:disabled:bg-red-950 dark:disabled:text-red-500 sm:order-2"
                  >
                    {isCancelling ? "Cancelling..." : "Yes, cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {accountDialog === "name" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const trimmedName = nameDraft.trim();
                if (!trimmedName) return;

                setIsSavingName(true);
                setNameError("");

                try {
                  await authServices.updateProfileName(trimmedName);
                  setAccountName(trimmedName);
                  setAccountDialog(null);
                } catch (error) {
                  setNameError(
                    error instanceof Error
                      ? error.message
                      : "Unable to update name",
                  );
                } finally {
                  setIsSavingName(false);
                }
              }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Edit name
                </h3>
                <button
                  type="button"
                  onClick={() => setAccountDialog(null)}
                  disabled={isSavingName}
                  aria-label="Close name editor"
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <label
                htmlFor="account-name"
                className="mt-6 block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Name
              </label>
              <input
                id="account-name"
                type="text"
                required
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                disabled={isSavingName}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />

              {nameError && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-red-600 dark:text-red-400"
                >
                  {nameError}
                </p>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAccountDialog(null)}
                  disabled={isSavingName}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingName || !nameDraft.trim()}
                  className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  {isSavingName ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {accountDialog === "delete" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-400/20 dark:bg-slate-900">
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
              <button
                type="button"
                onClick={() => setAccountDialog(null)}
                aria-label="Close delete account dialog"
                className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="p-6 pt-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/5">
                  <AlertTriangle size={28} strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
                  Delete your account?
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This permanently removes your Omni account and cannot be
                  reversed.
                </p>

                <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-400/20 dark:bg-red-400/[0.06]">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
                    Before you continue
                  </p>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasConfirmedDataDeletion}
                      onChange={(event) =>
                        setHasConfirmedDataDeletion(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red-600"
                    />
                    <span>
                      All chats, files, generated content, and account data will
                      be permanently deleted.
                    </span>
                  </label>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasConfirmedIrreversible}
                      onChange={(event) =>
                        setHasConfirmedIrreversible(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red-600"
                    />
                    <span>
                      I understand this action takes effect immediately and
                      cannot be undone.
                    </span>
                  </label>
                </div>

                {deleteAccountError && (
                  <p
                    role="alert"
                    className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    {deleteAccountError}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAccountDialog(null)}
                    disabled={isDeletingAccount}
                    className="order-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-white/10 sm:order-1"
                  >
                    Keep my account
                  </button>
                  <button
                    type="button"
                    disabled={
                      !hasConfirmedDataDeletion ||
                      !hasConfirmedIrreversible ||
                      isDeletingAccount
                    }
                    onClick={deleteAccount}
                    className="order-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none dark:disabled:bg-red-950 dark:disabled:text-red-500 sm:order-2"
                  >
                    {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
