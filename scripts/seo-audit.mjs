/**
 * Fetch a live URL and report the SEO signals a crawler would see.
 *
 * Checks the raw HTML response, not a rendered DOM, so anything it misses is
 * also missing for a crawler that does not execute JavaScript.
 *
 * Usage:
 *   node scripts/seo-audit.mjs https://www.sparesx.com/product/<slug>
 *   npm run seo:audit -- https://www.sparesx.com/product/<slug>
 */

const url = process.argv[2];

if (!url) {
  console.error("Usage: node scripts/seo-audit.mjs <url>");
  process.exit(1);
}

function firstMatch(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

function allMatches(html, pattern) {
  return [...html.matchAll(pattern)].map((m) => m[1].trim());
}

function metaByName(html, name) {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`,
    "i",
  );
  return firstMatch(html, re) ?? firstMatch(html, alt);
}

function metaByProperty(html, property) {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
    "i",
  );
  return firstMatch(html, re) ?? firstMatch(html, alt);
}

function label(ok) {
  return ok ? "PASS" : "FAIL";
}

function line(name, value, ok) {
  const status = ok === undefined ? "    " : label(ok);
  console.log(`${status}  ${name.padEnd(22)} ${value ?? "(missing)"}`);
}

const res = await fetch(url, {
  redirect: "manual",
  headers: {
    // Identify as a crawler so any UA-conditional behaviour shows up here.
    "User-Agent":
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
});

console.log(`\nURL: ${url}\n`);
line("HTTP status", String(res.status), res.status === 200);

const xRobots = res.headers.get("x-robots-tag");
line("X-Robots-Tag", xRobots ?? "(none)", !xRobots?.includes("noindex"));

if (res.status >= 300 && res.status < 400) {
  line("Location", res.headers.get("location"));
  process.exit(1);
}

const html = await res.text();
console.log(`      HTML bytes            ${html.length}\n`);

const title = firstMatch(html, /<title>([^<]*)<\/title>/i);
line("Title", title, Boolean(title) && !/not found/i.test(title));
line("  length", title ? `${title.length} chars` : "-");

const description = metaByName(html, "description");
line("Meta description", description, Boolean(description));
line("  length", description ? `${description.length} chars` : "-");

const canonical = firstMatch(
  html,
  /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
) ?? firstMatch(
  html,
  /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
);

function normalizeUrl(value) {
  try {
    const u = new URL(value);
    u.hash = "";
    // Drop trailing slash except for origin root.
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return value;
  }
}

const requested = normalizeUrl(url);
const canonicalNorm = canonical ? normalizeUrl(canonical) : null;
const selfCanonical = Boolean(canonicalNorm && canonicalNorm === requested);
const pointsAtHome =
  Boolean(canonicalNorm) &&
  !requested.endsWith("://www.sparesx.com") &&
  !requested.endsWith("://www.sparesx.com/") &&
  (canonicalNorm === "https://www.sparesx.com" ||
    canonicalNorm === "https://www.sparesx.com/");

line("Canonical", canonical, selfCanonical && !pointsAtHome);
if (canonical && !selfCanonical) {
  line(
    "  self-canonical?",
    "NO — page declares a different preferred URL (OK for filters/ID→slug)",
    false,
  );
}
if (pointsAtHome) {
  line(
    "  homepage leak?",
    "YES — non-home URL canonicalizes to / (fix)",
    false,
  );
}

const robots = metaByName(html, "robots");
line("Robots meta", robots ?? "(none, defaults to index)", !robots?.includes("noindex"));

const ogTypes = allMatches(
  html,
  /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']*)["']/gi,
);
line("og:type", ogTypes.join(", ") || null, ogTypes.length === 1);
line("og:title", metaByProperty(html, "og:title"));
line("og:url", metaByProperty(html, "og:url"));
line("og:image", metaByProperty(html, "og:image"));
line("twitter:card", metaByName(html, "twitter:card"));

const h1s = allMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map((h) =>
  h.replace(/<[^>]+>/g, "").trim(),
);
line("H1", h1s.join(" | ") || null, h1s.length === 1);

const blocks = allMatches(
  html,
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
);
console.log(`\n      JSON-LD blocks        ${blocks.length}`);

for (const raw of blocks) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    line("  JSON-LD parse", err.message, false);
    continue;
  }

  const type = parsed["@type"];
  console.log(`\n      --- ${type} ---`);

  if (type === "Product") {
    line("  name", parsed.name, Boolean(parsed.name));
    line("  description", parsed.description?.slice(0, 60), Boolean(parsed.description));
    const images = [].concat(parsed.image ?? []);
    line("  image", images[0], images.length > 0);
    line(
      "  image absolute",
      images.every((i) => /^https?:\/\//.test(i)) ? "yes" : "no",
      images.length > 0 && images.every((i) => /^https?:\/\//.test(i)),
    );
    line("  sku", parsed.sku, Boolean(parsed.sku));
    line("  brand", parsed.brand?.name, Boolean(parsed.brand?.name));
    line("  itemCondition", parsed.itemCondition, Boolean(parsed.itemCondition));
    line("  offers.price", parsed.offers?.price, parsed.offers?.price != null);
    line(
      "  offers.currency",
      parsed.offers?.priceCurrency,
      parsed.offers?.priceCurrency === "INR",
    );
    line(
      "  offers.availability",
      parsed.offers?.availability,
      Boolean(parsed.offers?.availability),
    );
    line("  offers.url", parsed.offers?.url, Boolean(parsed.offers?.url));
    line("  offers.seller", parsed.offers?.seller?.name);
  } else if (type === "BreadcrumbList") {
    for (const item of parsed.itemListElement ?? []) {
      line(`  ${item.position}. ${item.name}`, item.item);
    }
  }
}

// Content a non-JS crawler can read.
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

console.log(`\n      Visible text chars    ${text.length}`);

const internalLinks = new Set(
  allMatches(html, /<a[^>]+href=["'](\/[^"'#?]*)["']/gi),
);
const productLinks = [...internalLinks].filter((h) => h.startsWith("/product/"));
console.log(`      Internal links        ${internalLinks.size}`);
console.log(`      Links to products     ${productLinks.length}`);
