/** Deep-link helpers for seller demand → request board / new listing. */

/** Prefill the public request submit tab from a failed / structured search. */
export function requestSubmitHref(opts: {
  q?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  deviceCategory?: string | null;
  city?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("tab", "submit");
  const q =
    opts.q?.trim() ||
    [opts.brand, opts.deviceModel, opts.partType].filter(Boolean).join(" ");
  if (q) params.set("q", q);
  if (opts.brand?.trim()) params.set("brand", opts.brand.trim());
  if (opts.deviceModel?.trim()) params.set("deviceModel", opts.deviceModel.trim());
  if (opts.partType?.trim()) params.set("partType", opts.partType.trim());
  if (opts.deviceCategory?.trim()) {
    params.set("deviceCategory", opts.deviceCategory.trim());
  }
  if (opts.city?.trim()) params.set("city", opts.city.trim());
  return `/requests?${params.toString()}`;
}

export function requestBoardHref(opts: {
  brand?: string | null;
  deviceModel?: string | null;
  category?: string | null;
  requestId?: string | null;
}): string {
  const params = new URLSearchParams();
  const query = [opts.brand, opts.deviceModel, opts.category]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");
  if (query) params.set("q", query);
  if (opts.requestId) params.set("focus", String(opts.requestId));
  const qs = params.toString();
  return qs ? `/requests?${qs}` : "/requests";
}

export function listPartHref(opts: {
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  deviceCategory?: string | null;
}): string {
  const params = new URLSearchParams();
  if (opts.brand?.trim()) params.set("brand", opts.brand.trim());
  if (opts.deviceModel?.trim()) params.set("deviceModel", opts.deviceModel.trim());
  if (opts.partType?.trim()) params.set("partType", opts.partType.trim());
  if (opts.deviceCategory?.trim()) {
    params.set("deviceCategory", opts.deviceCategory.trim());
  }
  const qs = params.toString();
  return qs
    ? `/technician/products/new?${qs}`
    : "/technician/products/new";
}
