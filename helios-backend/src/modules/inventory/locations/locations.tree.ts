import type { LocationRow } from '../inventory.types.js';

export interface LocationTreeNode {
  locationId: string;
  locationCode: string;
  locationName: string;
  locationType: string;
  status: string;
  isPickable: boolean;
  isReceivable: boolean;
  isDispatchable: boolean;
  isQuarantine: boolean;
  children: LocationTreeNode[];
}

/**
 * Build a tree structure from a flat list of locations.
 */
export function buildLocationTree(locations: LocationRow[]): LocationTreeNode[] {
  const map = new Map<string, LocationTreeNode>();
  const roots: LocationTreeNode[] = [];

  // Create nodes
  for (const loc of locations) {
    map.set(loc.location_id, {
      locationId: loc.location_id,
      locationCode: loc.location_code,
      locationName: loc.location_name,
      locationType: loc.location_type,
      status: loc.status,
      isPickable: loc.is_pickable,
      isReceivable: loc.is_receivable,
      isDispatchable: loc.is_dispatchable,
      isQuarantine: loc.is_quarantine,
      children: [],
    });
  }

  // Build hierarchy
  for (const loc of locations) {
    const node = map.get(loc.location_id)!;
    if (loc.parent_location_id && map.has(loc.parent_location_id)) {
      map.get(loc.parent_location_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

