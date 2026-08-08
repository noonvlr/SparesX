/**
 * City / region adjacency for India B2B discovery.
 * No GPS — city strings only. Clusters are approximate metro / region groups.
 */

const CITY_CLUSTERS: string[][] = [
  ["Chennai", "Tambaram", "Avadi", "Chengalpattu", "Kanchipuram", "Tiruvallur"],
  ["Bengaluru", "Bangalore", "Whitefield", "Electronic City", "Yelahanka", "Mysuru", "Mysore"],
  ["Hyderabad", "Secunderabad", "Gachibowli", "Kompally"],
  ["Mumbai", "Navi Mumbai", "Thane", "Kalyan", "Pune", "Vasai", "Virar"],
  ["Delhi", "New Delhi", "Noida", "Greater Noida", "Gurgaon", "Gurugram", "Ghaziabad", "Faridabad"],
  ["Kolkata", "Howrah", "Salt Lake", "Dum Dum"],
  ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara"],
  ["Jaipur", "Ajmer", "Jodhpur"],
  ["Coimbatore", "Tiruppur", "Erode", "Salem"],
  ["Kochi", "Ernakulam", "Thrissur", "Kozhikode", "Trivandrum", "Thiruvananthapuram"],
  ["Madurai", "Tirunelveli", "Tuticorin", "Thoothukudi"],
  ["Lucknow", "Kanpur", "Varanasi", "Allahabad", "Prayagraj"],
  ["Chandigarh", "Mohali", "Panchkula", "Ludhiana", "Amritsar"],
  ["Indore", "Bhopal", "Gwalior"],
  ["Nagpur", "Nashik", "Aurangabad"],
  ["Visakhapatnam", "Vijayawada", "Guntur"],
];

const ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  mysore: "Mysuru",
  gurgaon: "Gurugram",
  trivandrum: "Thiruvananthapuram",
  tuticorin: "Thoothukudi",
  allahabad: "Prayagraj",
};

function norm(city: string) {
  return city.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Canonical display name when known. */
export function canonicalizeCity(city: string): string {
  const n = norm(city);
  if (!n) return "";
  const alias = ALIASES[n];
  if (alias) return alias;
  for (const cluster of CITY_CLUSTERS) {
    const hit = cluster.find((c) => norm(c) === n);
    if (hit) return hit;
  }
  return city.trim();
}

/** Same city + nearby cities in the same metro/region cluster. */
export function expandNearbyCities(city: string): string[] {
  const preferred = canonicalizeCity(city);
  if (!preferred) return [];
  const n = norm(preferred);
  for (const cluster of CITY_CLUSTERS) {
    if (cluster.some((c) => norm(c) === n || norm(ALIASES[norm(c)] || c) === n)) {
      const names = new Set<string>();
      for (const c of cluster) {
        names.add(c);
        const a = ALIASES[norm(c)];
        if (a) names.add(a);
      }
      names.add(preferred);
      return [...names];
    }
  }
  return [preferred];
}

/** True if sellerCity is the preferred city (not merely nearby). */
export function isSameCity(preferred: string, sellerCity?: string | null) {
  if (!preferred || !sellerCity) return false;
  return norm(canonicalizeCity(preferred)) === norm(canonicalizeCity(sellerCity));
}

/** Well-known city names for NL parsing ("near Chennai"). */
export function knownCityNames(): string[] {
  const set = new Set<string>();
  for (const cluster of CITY_CLUSTERS) {
    for (const c of cluster) set.add(c);
  }
  for (const a of Object.keys(ALIASES)) {
    set.add(a.replace(/\b\w/g, (ch) => ch.toUpperCase()));
  }
  return [...set];
}
