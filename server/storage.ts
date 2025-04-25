import { 
  User, InsertUser, Client, InsertClient, Visit, InsertVisit, 
  Invoice, InsertInvoice
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByUserId(userId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Visit operations
  getVisit(id: number): Promise<Visit | undefined>;
  getVisitsByUserId(userId: number): Promise<Visit[]>;
  getVisitsByClientId(clientId: number): Promise<Visit[]>;
  getVisitsByDate(userId: number, date: Date): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined>;
  getUninvoicedVisits(userId: number): Promise<Visit[]>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined>;
  markVisitAsInvoiced(visitId: number): Promise<Visit | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private visits: Map<number, Visit>;
  private invoices: Map<number, Invoice>;
  private userId: number;
  private clientId: number;
  private visitId: number;
  private invoiceId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.visits = new Map();
    this.invoices = new Map();
    this.userId = 1;
    this.clientId = 1;
    this.visitId = 1;
    this.invoiceId = 1;
    
    // Create a test user for development
    this.createUser({
      username: "demo",
      password: "password",
      businessType: "Field Service",
      businessHours: JSON.stringify({
        days: ["mon", "tue", "wed", "thu", "fri"],
        startTime: "08:00",
        endTime: "17:00"
      })
    });
    
    // Create a test client
    this.createClient({
      userId: 1,
      name: "Test Client",
      address: "123 Main St, Anytown, USA",
      email: "client@example.com",
      phone: "555-123-4567",
      notes: "Test client for demo purposes"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByUserId(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const createdAt = new Date();
    const client: Client = { ...insertClient, id, createdAt };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Visit operations
  async getVisit(id: number): Promise<Visit | undefined> {
    return this.visits.get(id);
  }

  async getVisitsByUserId(userId: number): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(
      (visit) => visit.userId === userId
    );
  }

  async getVisitsByClientId(clientId: number): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(
      (visit) => visit.clientId === clientId
    );
  }

  async getVisitsByDate(userId: number, date: Date): Promise<Visit[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.visits.values()).filter(
      (visit) => 
        visit.userId === userId && 
        visit.date >= startOfDay && 
        visit.date <= endOfDay
    );
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const id = this.visitId++;
    const date = new Date();
    const visit: Visit = { 
      ...insertVisit, 
      id, 
      date,
      hasInvoice: false
    };
    this.visits.set(id, visit);
    return visit;
  }

  async updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined> {
    const visit = await this.getVisit(id);
    if (!visit) return undefined;
    
    const updatedVisit = { ...visit, ...visitData };
    this.visits.set(id, updatedVisit);
    return updatedVisit;
  }

  async getUninvoicedVisits(userId: number): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(
      (visit) => visit.userId === userId && !visit.hasInvoice && visit.endTime !== null
    );
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.userId === userId
    );
  }

  async getInvoicesByClientId(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceId++;
    const date = new Date();
    const invoice: Invoice = { ...insertInvoice, id, date };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async markVisitAsInvoiced(visitId: number): Promise<Visit | undefined> {
    const visit = await this.getVisit(visitId);
    if (!visit) return undefined;
    
    const updatedVisit = { ...visit, hasInvoice: true };
    this.visits.set(visitId, updatedVisit);
    return updatedVisit;
  }
}

export const storage = new MemStorage();
