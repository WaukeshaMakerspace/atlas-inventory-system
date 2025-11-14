import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = mysqlEnum('user_role', ['admin', 'staff', 'volunteer', 'member']);
export const locationTypeEnum = mysqlEnum('location_type', ['area', 'zone', 'cabinet', 'drawer', 'bin']);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: userRoleEnum.notNull().default('member'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: varchar('image', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}));

export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: int('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  providerIdx: index('provider_idx').on(table.provider, table.providerAccountId),
}));

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  sessionTokenIdx: uniqueIndex('session_token_idx').on(table.sessionToken),
  userIdIdx: index('user_id_idx').on(table.userId),
}));

export const apiKeys = mysqlTable('api_keys', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
}, (table) => ({
  keyIdx: uniqueIndex('key_idx').on(table.key),
  createdByIdx: index('created_by_idx').on(table.createdById),
}));

// ============================================================================
// LOCATIONS (Hierarchical)
// ============================================================================

export const locations = mysqlTable('locations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: locationTypeEnum, // Keep temporarily for migration
  locationTypeTagId: varchar('location_type_tag_id', { length: 255 }),
  description: text('description'),
  parentId: varchar('parent_id', { length: 255 }),
  path: varchar('path', { length: 1000 }).notNull(), // e.g., "/Woodshop/Zone A/Cabinet 1"
  pathIds: varchar('path_ids', { length: 1000 }).notNull(), // e.g., "/id1/id2/id3" for efficient queries
  sortOrder: int('sort_order').default(0),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
}, (table) => ({
  parentIdIdx: index('parent_id_idx').on(table.parentId),
  typeIdx: index('type_idx').on(table.type),
  locationTypeTagIdIdx: index('location_type_tag_id_idx').on(table.locationTypeTagId),
}));

// ============================================================================
// TAG CATEGORIES & TAGS
// ============================================================================

export const tagCategories = mysqlTable('tag_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('category_name_idx').on(table.name),
}));

export const tags = mysqlTable('tags', {
  id: varchar('id', { length: 255 }).primaryKey(),
  categoryId: varchar('category_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
}, (table) => ({
  categoryIdIdx: index('category_id_idx').on(table.categoryId),
  uniqueCategoryName: uniqueIndex('unique_category_name').on(table.categoryId, table.name),
}));

// ============================================================================
// RESOURCE MODELS & INSTANCES
// ============================================================================

export const resourceModels = mysqlTable('resource_models', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  modelNumber: varchar('model_number', { length: 255 }),
  specifications: text('specifications'), // JSON string
  imageUrl: varchar('image_url', { length: 500 }),
  documentationUrl: varchar('documentation_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
}, (table) => ({
  nameIdx: index('name_idx').on(table.name),
  manufacturerIdx: index('manufacturer_idx').on(table.manufacturer),
}));

export const resourceInstances = mysqlTable('resource_instances', {
  id: varchar('id', { length: 255 }).primaryKey(),
  modelId: varchar('model_id', { length: 255 }).notNull(),
  locationId: varchar('location_id', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 255 }),
  assetTag: varchar('asset_tag', { length: 255 }),
  quantity: int('quantity').notNull().default(1),
  condition: mysqlEnum('condition', ['excellent', 'good', 'fair', 'poor', 'broken']).default('good'),
  notes: text('notes'),
  purchaseDate: timestamp('purchase_date', { mode: 'date' }),
  purchasePrice: int('purchase_price'), // Store as cents
  isCheckoutEnabled: boolean('is_checkout_enabled').notNull().default(false),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  createdById: varchar('created_by_id', { length: 255 }).notNull(),
}, (table) => ({
  modelIdIdx: index('model_id_idx').on(table.modelId),
  locationIdIdx: index('location_id_idx').on(table.locationId),
  serialNumberIdx: index('serial_number_idx').on(table.serialNumber),
  assetTagIdx: index('asset_tag_idx').on(table.assetTag),
  isAvailableIdx: index('is_available_idx').on(table.isAvailable),
}));

// ============================================================================
// MANY-TO-MANY RELATIONSHIPS
// ============================================================================

export const resourceModelTags = mysqlTable('resource_model_tags', {
  id: varchar('id', { length: 255 }).primaryKey(),
  modelId: varchar('model_id', { length: 255 }).notNull(),
  tagId: varchar('tag_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  modelIdIdx: index('model_id_idx').on(table.modelId),
  tagIdIdx: index('tag_id_idx').on(table.tagId),
  uniqueModelTag: uniqueIndex('unique_model_tag').on(table.modelId, table.tagId),
}));

export const resourceInstanceTags = mysqlTable('resource_instance_tags', {
  id: varchar('id', { length: 255 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 255 }).notNull(),
  tagId: varchar('tag_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: index('instance_id_idx').on(table.instanceId),
  tagIdIdx: index('tag_id_idx').on(table.tagId),
  uniqueInstanceTag: uniqueIndex('unique_instance_tag').on(table.instanceId, table.tagId),
}));

// ============================================================================
// IMAGES
// ============================================================================

export const images = mysqlTable('images', {
  id: varchar('id', { length: 255 }).primaryKey(),
  url: varchar('url', { length: 500 }).notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  s3Bucket: varchar('s3_bucket', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: int('file_size').notNull(), // bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  width: int('width'),
  height: int('height'),
  caption: text('caption'),
  altText: varchar('alt_text', { length: 255 }),
  // Polymorphic relationship
  entityType: mysqlEnum('entity_type', ['location', 'tag', 'resource_model', 'resource_instance']).notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  uploadedById: varchar('uploaded_by_id', { length: 255 }).notNull(),
}, (table) => ({
  entityIdx: index('entity_idx').on(table.entityType, table.entityId),
  s3KeyIdx: uniqueIndex('s3_key_idx').on(table.s3Key),
}));

// ============================================================================
// CHECKOUT SYSTEM
// ============================================================================

export const checkouts = mysqlTable('checkouts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  checkoutAt: timestamp('checkout_at').defaultNow().notNull(),
  expectedReturnAt: timestamp('expected_return_at', { mode: 'date' }),
  actualReturnAt: timestamp('actual_return_at', { mode: 'date' }),
  notes: text('notes'),
  returnNotes: text('return_notes'),
  returnCondition: mysqlEnum('return_condition', ['excellent', 'good', 'fair', 'poor', 'broken']),
  isReturned: boolean('is_returned').notNull().default(false),
}, (table) => ({
  instanceIdIdx: index('instance_id_idx').on(table.instanceId),
  userIdIdx: index('user_id_idx').on(table.userId),
  isReturnedIdx: index('is_returned_idx').on(table.isReturned),
  checkoutAtIdx: index('checkout_at_idx').on(table.checkoutAt),
}));

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  action: varchar('action', { length: 100 }).notNull(), // e.g., "CREATE", "UPDATE", "DELETE"
  entityType: varchar('entity_type', { length: 100 }).notNull(), // e.g., "resource_model", "location"
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }), // null if done by API key
  apiKeyId: varchar('api_key_id', { length: 255 }), // null if done by user
  changesBefore: text('changes_before'), // JSON snapshot
  changesAfter: text('changes_after'), // JSON snapshot
  metadata: text('metadata'), // Additional JSON data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('entity_idx').on(table.entityType, table.entityId),
  userIdIdx: index('user_id_idx').on(table.userId),
  apiKeyIdIdx: index('api_key_id_idx').on(table.apiKeyId),
  actionIdx: index('action_idx').on(table.action),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  createdLocations: many(locations),
  createdResourceModels: many(resourceModels),
  createdResourceInstances: many(resourceInstances),
  checkouts: many(checkouts),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
  }),
  children: many(locations),
  resourceInstances: many(resourceInstances),
  createdBy: one(users, {
    fields: [locations.createdById],
    references: [users.id],
  }),
}));

export const resourceModelsRelations = relations(resourceModels, ({ one, many }) => ({
  instances: many(resourceInstances),
  tags: many(resourceModelTags),
  createdBy: one(users, {
    fields: [resourceModels.createdById],
    references: [users.id],
  }),
}));

export const resourceInstancesRelations = relations(resourceInstances, ({ one, many }) => ({
  model: one(resourceModels, {
    fields: [resourceInstances.modelId],
    references: [resourceModels.id],
  }),
  location: one(locations, {
    fields: [resourceInstances.locationId],
    references: [locations.id],
  }),
  tags: many(resourceInstanceTags),
  checkouts: many(checkouts),
  createdBy: one(users, {
    fields: [resourceInstances.createdById],
    references: [users.id],
  }),
}));

export const tagCategoriesRelations = relations(tagCategories, ({ one, many }) => ({
  tags: many(tags),
  createdBy: one(users, {
    fields: [tagCategories.createdById],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  category: one(tagCategories, {
    fields: [tags.categoryId],
    references: [tagCategories.id],
  }),
  resourceModels: many(resourceModelTags),
  resourceInstances: many(resourceInstanceTags),
  createdBy: one(users, {
    fields: [tags.createdById],
    references: [users.id],
  }),
}));

export const resourceModelTagsRelations = relations(resourceModelTags, ({ one }) => ({
  model: one(resourceModels, {
    fields: [resourceModelTags.modelId],
    references: [resourceModels.id],
  }),
  tag: one(tags, {
    fields: [resourceModelTags.tagId],
    references: [tags.id],
  }),
}));

export const resourceInstanceTagsRelations = relations(resourceInstanceTags, ({ one }) => ({
  instance: one(resourceInstances, {
    fields: [resourceInstanceTags.instanceId],
    references: [resourceInstances.id],
  }),
  tag: one(tags, {
    fields: [resourceInstanceTags.tagId],
    references: [tags.id],
  }),
}));

export const checkoutsRelations = relations(checkouts, ({ one }) => ({
  instance: one(resourceInstances, {
    fields: [checkouts.instanceId],
    references: [resourceInstances.id],
  }),
  user: one(users, {
    fields: [checkouts.userId],
    references: [users.id],
  }),
}));
