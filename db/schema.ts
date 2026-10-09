import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const content = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: integer("expires_at").notNull(),
});

export const attempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});

export const assets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
  uploadState: text("upload_state").notNull().default("ready"),
  durationSeconds: real("duration_seconds"),
});
