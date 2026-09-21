import type { MetadataRoute } from "next";

// The consoles are private and cookie-gated; the application form and a public certificate
// verification page are the two URLs worth finding.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/apply", "/verify/"], disallow: ["/home", "/admin", "/auth/", "/api/"] }],
  };
}
