import { users, locations, resourceModels, resourceInstances, tags, tagCategories, checkouts } from '@/db/schema';

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type ResourceModel = typeof resourceModels.$inferSelect;
export type NewResourceModel = typeof resourceModels.$inferInsert;

export type ResourceInstance = typeof resourceInstances.$inferSelect;
export type NewResourceInstance = typeof resourceInstances.$inferInsert;

export type TagCategory = typeof tagCategories.$inferSelect;
export type NewTagCategory = typeof tagCategories.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;

// Extended types with relations
export type ResourceWithLocation = ResourceInstance & {
  model: ResourceModel;
  location: Location;
};

export type LocationWithChildren = Location & {
  children: Location[];
};

export type ResourceModelWithTags = ResourceModel & {
  tags: Tag[];
};

// API Response types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  message?: string;
};

// Search types
export type SearchFilters = {
  query?: string;
  locationId?: string;
  tags?: string[];
  condition?: string[];
  available?: boolean;
};

export type SearchResult = {
  instances: ResourceWithLocation[];
  total: number;
  page: number;
  pageSize: number;
};
