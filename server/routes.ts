import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertVisitSchema, 
  insertInvoiceSchema,
  businessHoursSchema
} from "@shared/schema";
import { calculateDistance, isWithinRadius } from "./utils/location";
import { generateInvoiceNumber } from "./utils/invoice";
import { ZodError } from "zod";
import { setupAuth } from "./auth";

// Extend session data type to include userId
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication first
  setupAuth(app);

  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Client routes
  apiRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clients = await storage.getClientsByUserId(userId);
      return res.status(200).json(clients);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get clients" });
    }
  });

  apiRouter.post("/clients", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clientData = insertClientSchema.parse({
        ...req.body,
        userId
      });

      const newClient = await storage.createClient(clientData);
      return res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Failed to create client" });
    }
  });

  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (client.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to client" });
      }

      return res.status(200).json(client);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get client" });
    }
  });

  apiRouter.put("/clients/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (client.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to client" });
      }

      const updatedClient = await storage.updateClient(clientId, req.body);
      return res.status(200).json(updatedClient);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update client" });
    }
  });

  apiRouter.delete("/clients/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (client.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to client" });
      }

      await storage.deleteClient(clientId);
      return res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Visit routes
  apiRouter.get("/visits", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { date, clientId } = req.query;
      
      if (clientId) {
        const visits = await storage.getVisitsByClientId(parseInt(clientId as string));
        return res.status(200).json(visits.filter(v => v.userId === userId));
      }
      
      if (date) {
        const visits = await storage.getVisitsByDate(userId, new Date(date as string));
        return res.status(200).json(visits);
      }

      const visits = await storage.getVisitsByUserId(userId);
      return res.status(200).json(visits);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get visits" });
    }
  });

  apiRouter.post("/visits/start", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Visit start request body:", req.body);
      
      const { latitude, longitude, address } = req.body;
      
      if (!latitude || !longitude) {
        console.error("Missing required location data:", { latitude, longitude });
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      // Check if location matches any client
      const clients = await storage.getClientsByUserId(userId);
      console.log("User clients:", clients);
      
      let matchedClient = null;
      let isKnownLocation = false;
      
      for (const client of clients) {
        if (client.latitude && client.longitude) {
          const distance = calculateDistance(
            latitude, 
            longitude, 
            client.latitude, 
            client.longitude
          );
          
          if (isWithinRadius(distance, 0.1)) { // 0.1 km = 100m radius
            matchedClient = client;
            isKnownLocation = true;
            console.log("Matched client by location:", matchedClient);
            break;
          }
        }
      }
      
      // Extract service-related fields from request
      const { serviceType, serviceDetails, billableAmount, notes, clientId } = req.body;
      console.log("Service data:", { serviceType, serviceDetails, billableAmount });
      
      // Determine which client to use
      let finalClientId = null;
      if (matchedClient) {
        finalClientId = matchedClient.id;
      } else if (clientId) {
        finalClientId = typeof clientId === 'string' ? parseInt(clientId) : clientId;
      }
      
      console.log("Final client ID:", finalClientId);
      
      const visitData = insertVisitSchema.parse({
        userId,
        clientId: finalClientId,
        address: address || (matchedClient ? matchedClient.address : "Unknown location"),
        startTime: new Date(),
        latitude,
        longitude,
        isKnownLocation,
        serviceType,
        serviceDetails,
        billableAmount
      });

      console.log("Parsed visit data:", visitData);
      
      const newVisit = await storage.createVisit(visitData);
      console.log("Created new visit:", newVisit);
      
      return res.status(201).json(newVisit);
    } catch (error) {
      console.error("Error starting visit:", error);
      
      if (error instanceof ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: error.errors });
      }
      
      return res.status(500).json({ message: "Failed to start visit" });
    }
  });

  apiRouter.post("/visits/:id/end", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const visitId = parseInt(req.params.id);
      const visit = await storage.getVisit(visitId);

      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to visit" });
      }

      if (visit.endTime) {
        return res.status(400).json({ message: "Visit already ended" });
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - visit.startTime.getTime()) / 60000); // minutes

      const updatedVisit = await storage.updateVisit(visitId, {
        endTime,
        duration
      });

      return res.status(200).json(updatedVisit);
    } catch (error) {
      return res.status(500).json({ message: "Failed to end visit" });
    }
  });

  apiRouter.get("/visits/current", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const visits = await storage.getVisitsByUserId(userId);
      const currentVisit = visits.find(v => v.endTime === null);

      if (!currentVisit) {
        return res.status(404).json({ message: "No active visit found" });
      }

      return res.status(200).json(currentVisit);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get current visit" });
    }
  });

  apiRouter.get("/visits/uninvoiced", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const uninvoicedVisits = await storage.getUninvoicedVisits(userId);
      return res.status(200).json(uninvoicedVisits);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get uninvoiced visits" });
    }
  });

  // Invoice routes
  apiRouter.get("/invoices", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.query;
      
      if (clientId) {
        const invoices = await storage.getInvoicesByClientId(parseInt(clientId as string));
        return res.status(200).json(invoices.filter(i => i.userId === userId));
      }

      const invoices = await storage.getInvoicesByUserId(userId);
      return res.status(200).json(invoices);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  apiRouter.post("/invoices", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { visitId, amount, notes, isPaid = false } = req.body;
      
      if (!visitId || !amount) {
        return res.status(400).json({ message: "Visit ID and amount are required" });
      }

      const visit = await storage.getVisit(visitId);
      
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to visit" });
      }

      if (visit.hasInvoice) {
        return res.status(400).json({ message: "Visit already has an invoice" });
      }

      const invoiceNumber = generateInvoiceNumber();
      
      const invoiceData = insertInvoiceSchema.parse({
        userId,
        clientId: visit.clientId,
        visitId,
        invoiceNumber,
        amount,
        isPaid,
        notes
      });

      const newInvoice = await storage.createInvoice(invoiceData);
      await storage.markVisitAsInvoiced(visitId);

      return res.status(201).json(newInvoice);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  apiRouter.get("/invoices/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to invoice" });
      }

      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  apiRouter.put("/invoices/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to invoice" });
      }

      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      return res.status(200).json(updatedInvoice);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
