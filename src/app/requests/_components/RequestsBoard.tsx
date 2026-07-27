"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequestForm from "./RequestForm";

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
        <div className="inline-flex rounded-2xl bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setTab("browse");
              router.replace("/requests");
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === "browse"
                ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Browse requests
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("submit");
              router.replace("/requests?tab=submit");
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === "submit"
                ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Submit request
          </button>
        </div>
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
        <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
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
                  placeholder="Search keywords in description, brand, model, part..."
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-white border border-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500 animate-in fade-in zoom-in-95">
              <p className="mb-4">{emptyMessage}</p>
              <button
                type="button"
                onClick={() => setTab("submit")}
                className="inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Submit a request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request, index) => (
                <article
                  key={request._id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {highlightText(request.category, search)}
                        {request.brand ? (
                          <>
                            {" · "}
                            {highlightText(request.brand, search)}
                          </>
                        ) : null}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {request.deviceCategory && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 capitalize">
                            {request.deviceCategory}
                          </span>
                        )}
                        {request.deviceModel && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {highlightText(request.deviceModel, search)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 capitalize">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 flex-1 mb-4 line-clamp-4 leading-relaxed">
                    {highlightText(request.description, search)}
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      by {request.name} ·{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <button
                      type="button"
                      onClick={() => respondViaWhatsApp(request)}
                      className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs sm:text-sm font-semibold hover:bg-green-700 hover:shadow-md transition active:scale-95 whitespace-nowrap"
                    >
                      I have this part
                    </button>
                  </div>
                </article>
              ))}
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
