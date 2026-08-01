"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequestForm from "./RequestForm";
import RequestsTabs from "./RequestsTabs";

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
      <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function RequestsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "submit" ? "submit" : "browse";

  const [tab, setTab] = useState<"browse" | "submit">(initialTab);
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPromptId, setAuthPromptId] = useState<string | null>(null);

  // Keep local tab in sync when navigating Browse <-> Submit on the same page
  useEffect(() => {
    const next = searchParams.get("tab") === "submit" ? "submit" : "browse";
    setTab(next);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadRequests = async (query = search) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    const params = new URLSearchParams({ status: "open", limit: "50" });
    if (query) params.set("search", query);

    try {
      const res = await fetch(`/api/requests?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setIsAuthenticated(!!data.isAuthenticated || !!token);
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "browse") loadRequests(search);
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
      alert("No contact details available for this request.");
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
        <RequestsTabs active={tab === "submit" ? "submit" : "browse"} />
        {tab === "browse" && (
          <p className="text-sm text-gray-500 animate-in fade-in">
            {loading ? "Searching…" : `${total} open request${total === 1 ? "" : "s"}`}
          </p>
        )}
      </div>

      {tab === "submit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="lg:col-span-2">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Submit a part request
              </h2>
              <p className="text-sm text-gray-600">
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
          <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 h-fit animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-lg font-semibold text-gray-900">What happens next?</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                Your request is shared with verified sellers.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                Sellers contact you with availability and pricing.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                Compare offers and proceed with the best match.
              </li>
            </ul>
            <div className="rounded-lg bg-blue-50 text-blue-700 px-4 py-3 text-sm">
              Tip: mention condition, urgency, and city in the description for faster replies.
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
          {/* Marketplace-style search hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-5 sm:p-8 shadow-xl">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-blue-400/20 blur-2xl" />
            <div className="relative">
              <p className="text-blue-200 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                Live demand board
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Parts people need right now
              </h2>
              <p className="text-blue-100/90 text-sm sm:text-base mb-5 max-w-2xl">
                Browse open requests like a job feed — claim ones you can fulfill and message the buyer instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Try “Samsung screen”, “battery”, “iPhone 13”…"
                    className="w-full rounded-2xl border-0 bg-white text-gray-900 pl-12 pr-4 py-3.5 text-sm shadow-lg focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Display", "Battery", "Camera", "Charging port"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSearchInput(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/15 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {loading
                ? "Refreshing feed…"
                : `${total} open request${total === 1 ? "" : "s"}`}
            </p>
            <button
              type="button"
              onClick={() => setTab("submit")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Post a request
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-white border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">{emptyMessage}</p>
              <button
                type="button"
                onClick={() => setTab("submit")}
                className="mt-2 inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Submit a request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request, index) => {
                const initial = (request.name || "?").charAt(0).toUpperCase();
                const ageMs = Date.now() - new Date(request.createdAt).getTime();
                const hours = Math.max(1, Math.round(ageMs / 36e5));
                const ageLabel =
                  hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;

                return (
                  <article
                    key={request._id}
                    className="group relative bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 overflow-hidden"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition" />
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold flex-shrink-0 border border-slate-200">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                              {highlightText(request.category, search)}
                              {request.brand ? (
                                <span className="text-gray-500 font-semibold">
                                  {" · "}
                                  {highlightText(request.brand, search)}
                                </span>
                              ) : null}
                            </h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Open
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {request.deviceCategory && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 capitalize">
                                {request.deviceCategory}
                              </span>
                            )}
                            {request.deviceModel && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                                {highlightText(request.deviceModel, search)}
                              </span>
                            )}
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                              {ageLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                            {highlightText(request.description, search)}
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            Requested by <span className="font-medium text-gray-600">{request.name}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-stretch justify-end gap-2 sm:w-44 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => respondViaWhatsApp(request)}
                          className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 hover:shadow-md transition active:scale-[0.98]"
                        >
                          I have this part
                        </button>
                        <button
                          type="button"
                          onClick={() => respondViaWhatsApp(request)}
                          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Message buyer
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {authPromptId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login required</h3>
            <p className="text-sm text-gray-600 mb-6">
              Login or sign up to respond to part requests and contact buyers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(`/login?next=${encodeURIComponent("/requests")}`)
                }
                className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/register?next=${encodeURIComponent("/requests")}`,
                  )
                }
                className="py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold"
              >
                Sign up
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthPromptId(null)}
              className="mt-4 w-full text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
