import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

// One page_view per path change (automatic GA page views are disabled in index.html).
export default function PageViewTracker() {
  const { pathname } = useLocation();
  const last = useRef<string>();
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    const t = setTimeout(() => trackPageView(pathname), 300); // let page titles update first
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
