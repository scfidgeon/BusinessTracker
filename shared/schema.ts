import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  businessType: text("business_type").notNull(),
  businessHours: text("business_hours").notNull(), // Stored as JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  businessType: true,
  businessHours: true,
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  userId: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  notes: true,
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  address: text("address"),
  date: timestamp("date").defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in minutes
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isKnownLocation: boolean("is_known_location").default(false),
  hasInvoice: boolean("has_invoice").default(false),
  serviceType: text("service_type"), // Type of service provided
  serviceDetails: text("service_details"), // Details about the service
  billableAmount: doublePrecision("billable_amount"), // Amount that can be billed for the service
});

export const insertVisitSchema = createInsertSchema(visits).pick({
  userId: true,
  clientId: true,
  address: true,
  startTime: true,
  endTime: true,
  duration: true,
  latitude: true,
  longitude: true,
  isKnownLocation: true,
  serviceType: true,
  serviceDetails: true,
  billableAmount: true,
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  visitId: integer("visit_id").references(() => visits.id),
  invoiceNumber: text("invoice_number").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").defaultNow(),
  isPaid: boolean("is_paid").default(false),
  notes: text("notes"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  userId: true,
  clientId: true,
  visitId: true,
  invoiceNumber: true,
  amount: true,
  isPaid: true,
  notes: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Business hours schema for validation
export const daySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const businessHoursSchema = z.object({
  days: z.array(daySchema),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type BusinessHours = z.infer<typeof businessHoursSchema>;

// Service types schema
export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaultRate: z.number().optional(), // Default hourly or flat rate
});

export type Service = z.infer<typeof serviceSchema>;

// Common services for different business types
export const SERVICE_TYPES = {
  "Service Provider": [
    { id: "consultation", name: "Consultation", description: "Initial assessment and consultation services" },
    { id: "repair", name: "Repair Service", description: "Fixing or repairing existing systems or equipment" },
    { id: "maintenance", name: "Maintenance", description: "Regular upkeep and preventative maintenance" },
    { id: "installation", name: "Installation", description: "Installing new equipment or systems" },
    { id: "inspection", name: "Inspection", description: "Safety or quality inspections" },
  ],
  "Contractor": [
    { id: "construction", name: "Construction", description: "Building or construction services" },
    { id: "remodeling", name: "Remodeling", description: "Home or business remodeling services" },
    { id: "electrical", name: "Electrical Work", description: "Electrical installation or repair" },
    { id: "plumbing", name: "Plumbing", description: "Plumbing installation or repair" },
    { id: "roofing", name: "Roofing", description: "Roof installation or repair" },
  ],
  "Home Services": [
    { id: "cleaning", name: "Cleaning", description: "Home or office cleaning services" },
    { id: "landscaping", name: "Landscaping", description: "Yard maintenance and landscaping" },
    { id: "pest_control", name: "Pest Control", description: "Pest elimination and prevention" },
    { id: "carpet_cleaning", name: "Carpet Cleaning", description: "Deep carpet and upholstery cleaning" },
    { id: "window_cleaning", name: "Window Cleaning", description: "Window washing services" },
  ],
  "IT Consultant": [
    { id: "network_setup", name: "Network Setup", description: "Installing and configuring networks" },
    { id: "troubleshooting", name: "Troubleshooting", description: "Diagnosing and fixing technical issues" },
    { id: "software_installation", name: "Software Installation", description: "Installing and configuring software" },
    { id: "data_recovery", name: "Data Recovery", description: "Recovering lost or damaged data" },
    { id: "security_audit", name: "Security Audit", description: "Evaluating and improving security" },
  ],
  "Healthcare Provider": [
    { id: "examination", name: "Examination", description: "Patient examination and diagnosis" },
    { id: "treatment", name: "Treatment", description: "Medical treatment and therapy" },
    { id: "followup", name: "Follow-up Visit", description: "Follow-up care and checkups" },
    { id: "test", name: "Medical Test", description: "Conducting medical tests" },
    { id: "consultation", name: "Medical Consultation", description: "Professional medical consultation" },
  ],
};
