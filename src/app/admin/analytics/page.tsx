import { getAnalyticsBundle } from "@/lib/admin/analytics-page";
import AnalyticsClient from "./AnalyticsClient";

// Server component: load all analytics data in parallel, then
// hand to the client for chart rendering.
//
// On any data fetch failure the loader returns empty arrays /
// zero objects, so the page always renders. Empty states are
// the client component's job.

export default async function AdminAnalyticsPage() {
  const bundle = await getAnalyticsBundle();
  return <AnalyticsClient bundle={bundle} />;
}
