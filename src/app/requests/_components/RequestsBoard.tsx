"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequestForm from "./RequestForm";
import RequestsTabs from "./RequestsTabs";
import MyRequestsPanel from "./MyRequestsPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, Badge, EmptyState, Skeleton, Avatar } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

interface PartRequest {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  category: string;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: string;
  createdAt: string;
  hasContact?: boolean;
}

type RequestsTab = "browse" | "submit" | "mine";

function tabFromSearchParams(searchParams: URLSearchParams): RequestsTab {
  const t = searchParams.get("tab");
  if (t === "submit") return "submit";
  if (t === "mine") return "mine";
  return "browse";
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const tokens = query
    .trim()
    .split(/[\s,]+/)
    .filter((t) => t.length >= 2);
  if (!tokens.length) return text;

  const pattern = new RegExp(
    `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-[var(--warning-soft)] text-[var(--warning)] rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function RequestsBoard({
  initialRequests = [],
  initialTotal = 0,
}: {
  initialRequests?: PartRequest[];
  initialTotal?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = tabFromSearchParams(searchParams);
  const initialQuery =
    searchParams.get("q") ||
    searchParams.get("search") ||
    searchParams.get("brand") ||
    "";
  const focusId = searchParams.get("focus") || "";

  const [tab, setTab] = useState<RequestsTab>(initialTab);
  const [requests, setRequests] = useState<PartRequest[]>(initialRequests);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery.trim());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPromptId, setAuthPromptId] = useState<string | null>(null);

  // Keep local tab + deep-link query in sync with the URL
  useEffect(() => {
    setTab(tabFromSearchParams(searchParams));
    const nextQuery =
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("brand") ||
      "";
    if (nextQuery) {
      setSearchInput(nextQuery);
      setSearch(nextQuery.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!focusId || loading || tab !== "browse") return;
    const el = document.getElementById(`request-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, tab, requests]);

  const loadRequests = async (query = search, silent = false) => {
    if (!silent) setLoading(true);
    setIsAuthenticated(isLoggedInClient());
    const params = new URLSearchParams({ status: "open", limit: "50" });
    if (query) params.set("search", query);

    try {
      const res = await authFetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setIsAuthenticated(!!data.isAuthenticated || isLoggedInClient());
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // The server already rendered the anonymous board, so the first pass refreshes
  // silently (it only adds contact details for signed-in viewers).
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (tab !== "browse") return;
    const silent = isFirstLoad.current && !search;
    isFirstLoad.current = false;
    loadRequests(search, silent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab]);

  const respondViaWhatsApp = (request: PartRequest) => {
    if (!isAuthenticated) {
      setAuthPromptId(request._id);
      return;
    }
    if (!request.phone) {
      if (request.email) {
        window.location.href = `mailto:${request.email}?subject=${encodeURIComponent(
          `Regarding your ${request.category} request on SparesX`,
        )}`;
        return;
      }
      alert(
        request.hasContact
          ? "Contact details are private. Use SparesX chat or ask the requester to share WhatsApp after you connect."
          : "No contact details available for this request.",
      );
      return;
    }

    const phone = request.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Hi ${request.name}, I saw your SparesX request for ${request.category}${
        request.brand ? ` (${request.brand}` : ""
      }${request.deviceModel ? ` ${request.deviceModel}` : ""}${
        request.brand ? ")" : ""
      }. I may have the part you need.`,
    );
    window.open(
      `https://wa.me/${phone}?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const emptyMessage = useMemo(() => {
    if (search) return `No requests match “${search}”. Try different keywords.`;
    return "No open requests right now. Be the first to submit one.";
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-300">
        <RequestsTabs active={tab} />
        {tab === "browse" && (
          <p className="text-sm text-[var(--muted)] animate-in fade-in">
            {loading ? "Searching…" : `${total} open request${total === 1 ? "" : "s"}`}
          </p>
        )}
      </div>

      {tab === "submit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="lg:col-span-2">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mb-1">
                Submit a part request
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Same guided flow as listing a product — pick device, brand, model, then part.
              </p>
            </div>
            <RequestForm
              onSubmitted={() => {
                setTab("browse");
                router.replace("/requests");
                loadRequests("");
              }}
            />
          </div>
          <Card
            padding="lg"
            className="space-y-4 h-fit animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <h2 className="text-lg font-semibold text-[var(--ink)]">What happens next?</h2>
            <ul className="space-y-3 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="text-[var(--brand)] font-bold">1.</span>
                Your request is shared with matching sellers.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--brand)] font-bold">2.</span>
                Sellers contact you with availability and pricing.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--brand)] font-bold">3.</span>
                Compare offers and proceed with the best match.
              </li>
            </ul>
            <div className="rounded-[var(--radius)] bg-[var(--brand-soft)] text-[var(--brand-hover)] px-4 py-3 text-sm">
              Tip: mention condition, urgency, and city in the description for faster replies.
            </div>
          </Card>
        </div>
      ) : tab === "mine" ? (
        <MyRequestsPanel />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
          {/* Marketplace-style search hero */}
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--ink)] via-[var(--brand-hover)] to-[var(--brand)] text-[var(--ink-inverse)] p-5 sm:p-8 shadow-[var(--shadow-lg)]">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[var(--ink-inverse)]/10 blur-2xl" />
            <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-[var(--info)]/20 blur-2xl" />
            <div className="relative">
              <p className="text-[var(--brand-muted)] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                Live demand board
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Parts people need right now
              </h2>
              <p className="text-[var(--ink-inverse)]/90 text-sm sm:text-base mb-5 max-w-2xl">
                Browse open requests like a job feed — claim ones you can fulfill and message the buyer instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Try “Samsung screen”, “battery”, “iPhone 13”…"
                    className="pl-12 rounded-[var(--radius-lg)] border-0 shadow-[var(--shadow-md)] h-auto py-3.5"
                  />
                </div>
                {searchInput && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="rounded-[var(--radius-lg)] border-[var(--ink-inverse)]/20 bg-[var(--ink-inverse)]/10 text-[var(--ink-inverse)] hover:bg-[var(--ink-inverse)]/20"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Display", "Battery", "Camera", "Charging port"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSearchInput(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--ink-inverse)]/10 hover:bg-[var(--ink-inverse)]/20 border border-[var(--ink-inverse)]/15 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {loading
                ? "Refreshing feed…"
                : `${total} open request${total === 1 ? "" : "s"}`}
            </p>
            <Button
              type="button"
              variant="link"
              onClick={() => router.replace("/requests?tab=submit")}
              className="text-sm font-semibold"
            >
              + Post a request
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-[var(--radius-lg)]" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="border-dashed rounded-[var(--radius-xl)]">
              <EmptyState
                title={emptyMessage}
                action={
                  <Button
                    type="button"
                    onClick={() => router.replace("/requests?tab=submit")}
                  >
                    Submit a request
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request, index) => {
                const ageMs = Date.now() - new Date(request.createdAt).getTime();
                const hours = Math.max(1, Math.round(ageMs / 36e5));
                const ageLabel =
                  hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
                const isFocused = Boolean(focusId && request._id === focusId);

                return (
                  <Card
                    id={`request-${request._id}`}
                    key={request._id}
                    hover
                    className={
                      isFocused
                        ? "group relative rounded-[var(--radius-lg)] overflow-hidden ring-2 ring-[var(--brand)] border-[var(--brand)]"
                        : "group relative rounded-[var(--radius-lg)] overflow-hidden"
                    }
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-hover)] opacity-0 group-hover:opacity-100 transition" />
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <Avatar name={request.name} size="md" className="flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-[var(--ink)] text-base sm:text-lg">
                              {highlightText(request.category, search)}
                              {request.brand ? (
                                <span className="text-[var(--muted)] font-semibold">
                                  {" · "}
                                  {highlightText(request.brand, search)}
                                </span>
                              ) : null}
                            </h3>
                            <Badge tone="success">Open</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {request.deviceCategory && (
                              <Badge tone="neutral" className="capitalize rounded-md">
                                {request.deviceCategory}
                              </Badge>
                            )}
                            {request.deviceModel && (
                              <Badge tone="info" className="rounded-md">
                                {highlightText(request.deviceModel, search)}
                              </Badge>
                            )}
                            <Badge tone="warning" className="rounded-md">
                              {ageLabel}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-2 sm:line-clamp-3">
                            {highlightText(request.description, search)}
                          </p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Requested by{" "}
                            <span className="font-medium text-[var(--ink-secondary)]">
                              {request.name}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-stretch justify-end gap-2 sm:w-44 flex-shrink-0">
                        <Button
                          type="button"
                          onClick={() => respondViaWhatsApp(request)}
                          className="bg-[#25D366] hover:bg-[#1ebe57] shadow-none"
                        >
                          I have this part
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => respondViaWhatsApp(request)}
                        >
                          Message buyer
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!authPromptId}
        onClose={() => setAuthPromptId(null)}
        title="Login required"
        footer={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <Button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent("/requests")}`)
              }
            >
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(
                  `/register?next=${encodeURIComponent("/requests")}`,
                )
              }
            >
              Sign up
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          Login or sign up to respond to part requests and contact buyers.
        </p>
      </Modal>
    </div>
  );
}
