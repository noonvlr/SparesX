import Script from "next/script";

const ADSENSE_CLIENT = "ca-pub-8411517519858379";

/**
 * Google AdSense site-wide loader (Auto ads / account verification).
 * Equivalent to placing the official snippet in <head> on every page.
 */
export default function AdSenseScript() {
  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
