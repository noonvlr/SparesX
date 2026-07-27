"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequestForm from "./RequestForm";

interface PartRequest {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  category: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: string;
  createdAt: string;
  hasContact?: boolean;
}

export default function RequestsBoard() {
  const router = useRouter();
  const [tab, setTab] = useState<"browse" | "submit">("browse");
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPromptId, setAuthPromptId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    const params = new URLSearchParams({ status: "open", limit: "50" });
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/requests?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setRequests(data.requests || []);
      setIsAuthenticated(!!data.isAuthenticated || !!token);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

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
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("browse")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "browse"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Browse requests
          </button>
          <button
            type="button"
            onClick={() => setTab("submit")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "submit"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Submit request
          </button>
        </div>
      </div>

      {tab === "submit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RequestForm onSubmitted={() => setTab("browse")} />
          </div>
          <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 h-fit">
            <h2 className="text-lg font-semibold text-gray-900">
              What happens next?
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>• Your request is shared with verified sellers.</li>
              <li>• Sellers contact you with availability and pricing.</li>
              <li>• Compare offers and proceed with the best match.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by part, brand, model..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={loadRequests}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-white border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
              No open requests right now. Be the first to submit one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request) => (
                <article
                  key={request._id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {request.category}
                        {request.brand ? ` · ${request.brand}` : ""}
                      </h3>
                      {request.deviceModel && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Model: {request.deviceModel}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 flex-1 mb-4 line-clamp-4">
                    {request.description}
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      by {request.name} ·{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <button
                      type="button"
                      onClick={() => respondViaWhatsApp(request)}
                      className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs sm:text-sm font-semibold hover:bg-green-700 whitespace-nowrap"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Login required
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Login or sign up to respond to part requests and contact buyers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/login?next=${encodeURIComponent("/requests")}`,
                  )
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
