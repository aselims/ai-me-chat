import picomatch from "picomatch";
import type { DiscoveredRoute, DiscoveryConfig } from "@ai-me-chat/core";

/**
 * Filter discovered routes based on include/exclude glob patterns.
 * - If include is specified, only routes matching at least one include pattern are kept.
 * - If exclude is specified, routes matching any exclude pattern are removed.
 * - Exclude takes precedence over include.
 */
export function filterRoutes(
  routes: DiscoveredRoute[],
  config: Pick<DiscoveryConfig, "include" | "exclude">,
): DiscoveredRoute[] {
  let filtered = routes;

  if (config.include && config.include.length > 0) {
    const isIncluded = picomatch(config.include);
    filtered = filtered.filter((r) => isIncluded(r.path));
  }

  if (config.exclude && config.exclude.length > 0) {
    const isExcluded = picomatch(config.exclude);
    filtered = filtered.filter((r) => !isExcluded(r.path));
  }

  return filtered;
}
