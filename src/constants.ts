// GHL MCP Server Constants
// ========================

export const GHL_BASE_URL = process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com";
export const GHL_API_VERSION = process.env.GHL_API_VERSION || "2021-07-28";
export const GHL_API_KEY = process.env.GHL_API_KEY || "";
export const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";

export const CHARACTER_LIMIT = 50000;

// Rate limiting: 100 req/10s, 200k/day
export const RATE_LIMIT = {
  burstMax: 100,
  burstWindowMs: 10_000,
  dailyMax: 200_000,
};

// API Endpoints organized by module
export const ENDPOINTS = {
  // Contacts
  contacts: {
    search: "/contacts/search",
    get: (id: string) => `/contacts/${id}`,
    create: "/contacts/",
    update: (id: string) => `/contacts/${id}`,
    delete: (id: string) => `/contacts/${id}`,
    upsert: "/contacts/upsert",
    // Tags
    addTags: (id: string) => `/contacts/${id}/tags`,
    removeTags: (id: string) => `/contacts/${id}/tags`,
    // Tasks
    getTasks: (id: string) => `/contacts/${id}/tasks`,
    createTask: (id: string) => `/contacts/${id}/tasks`,
    getTask: (contactId: string, taskId: string) => `/contacts/${contactId}/tasks/${taskId}`,
    updateTask: (contactId: string, taskId: string) => `/contacts/${contactId}/tasks/${taskId}`,
    deleteTask: (contactId: string, taskId: string) => `/contacts/${contactId}/tasks/${taskId}`,
    // Notes
    getNotes: (id: string) => `/contacts/${id}/notes`,
    createNote: (id: string) => `/contacts/${id}/notes`,
    getNote: (contactId: string, noteId: string) => `/contacts/${contactId}/notes/${noteId}`,
    updateNote: (contactId: string, noteId: string) => `/contacts/${contactId}/notes/${noteId}`,
    deleteNote: (contactId: string, noteId: string) => `/contacts/${contactId}/notes/${noteId}`,
    // Campaigns & Workflows
    addToCampaign: (id: string) => `/contacts/${id}/campaigns`,
    removeFromCampaign: (contactId: string, campaignId: string) => `/contacts/${contactId}/campaigns/${campaignId}`,
    addToWorkflow: (id: string) => `/contacts/${id}/workflow/${id}`,
    removeFromWorkflow: (contactId: string, workflowId: string) => `/contacts/${contactId}/workflow/${workflowId}`,
  },

  // Conversations
  conversations: {
    search: "/conversations/search",
    get: (id: string) => `/conversations/${id}`,
    create: "/conversations/",
    update: (id: string) => `/conversations/${id}`,
    delete: (id: string) => `/conversations/${id}`,
    // Messages
    getMessages: (id: string) => `/conversations/${id}/messages`,
    sendMessage: "/conversations/messages",
    getMessageById: (id: string) => `/conversations/messages/${id}`,
    // Inbound
    sendInbound: "/conversations/messages/inbound",
    cancelScheduled: (messageId: string) => `/conversations/messages/${messageId}/schedule`,
    uploadFileMessage: "/conversations/messages/upload",
    getRecording: (locationId: string, messageId: string) => `/conversations/messages/${messageId}/locations/${locationId}/recording`,
  },

  // Calendars
  calendars: {
    list: "/calendars/",
    get: (id: string) => `/calendars/${id}`,
    create: "/calendars/",
    update: (id: string) => `/calendars/${id}`,
    delete: (id: string) => `/calendars/${id}`,
    getFreeSlots: (id: string) => `/calendars/${id}/free-slots`,
    // Events / Appointments
    getEvents: "/calendars/events",
    getEvent: (eventId: string) => `/calendars/events/${eventId}`,
    createEvent: "/calendars/events",
    updateEvent: (eventId: string) => `/calendars/events/${eventId}`,
    deleteEvent: (eventId: string) => `/calendars/events/${eventId}`,
    // Groups
    listGroups: "/calendars/groups",
    createGroup: "/calendars/groups",
    // Resources
    listResources: (resourceType: string) => `/calendars/resources/${resourceType}`,
    getResource: (resourceType: string, id: string) => `/calendars/resources/${resourceType}/${id}`,
    createResource: (resourceType: string) => `/calendars/resources/${resourceType}`,
    updateResource: (resourceType: string, id: string) => `/calendars/resources/${resourceType}/${id}`,
    deleteResource: (resourceType: string, id: string) => `/calendars/resources/${resourceType}/${id}`,
  },

  // Opportunities (Pipelines & Deals)
  opportunities: {
    search: "/opportunities/search",
    get: (id: string) => `/opportunities/${id}`,
    create: "/opportunities/",
    update: (id: string) => `/opportunities/${id}`,
    delete: (id: string) => `/opportunities/${id}`,
    updateStatus: (id: string) => `/opportunities/${id}/status`,
    // Pipelines
    listPipelines: "/opportunities/pipelines",
    getPipeline: (id: string) => `/opportunities/pipelines/${id}`,
  },

  // Workflows
  workflows: {
    list: "/workflows/",
    // Note: GHL API for workflows is limited — mainly trigger/add contacts
  },

  // Payments
  payments: {
    // Orders
    listOrders: "/payments/orders",
    getOrder: (id: string) => `/payments/orders/${id}`,
    // Transactions
    listTransactions: "/payments/transactions",
    getTransaction: (id: string) => `/payments/transactions/${id}`,
    // Subscriptions
    listSubscriptions: "/payments/subscriptions",
    getSubscription: (id: string) => `/payments/subscriptions/${id}`,
    // Invoices
    listInvoices: "/invoices/",
    getInvoice: (id: string) => `/invoices/${id}`,
    createInvoice: "/invoices/",
    updateInvoice: (id: string) => `/invoices/${id}`,
    deleteInvoice: (id: string) => `/invoices/${id}`,
    sendInvoice: (id: string) => `/invoices/${id}/send`,
    voidInvoice: (id: string) => `/invoices/${id}/void`,
    recordPayment: (id: string) => `/invoices/${id}/record-payment`,
    // Products / Prices
    listProducts: "/products/",
    getProduct: (id: string) => `/products/${id}`,
    createProduct: "/products/",
    listPrices: (productId: string) => `/products/${productId}/price`,
  },

  // Custom Fields & Values
  customFields: {
    list: "/locations/{locationId}/customFields",
    get: (id: string) => `/locations/{locationId}/customFields/${id}`,
    create: "/locations/{locationId}/customFields",
    update: (id: string) => `/locations/{locationId}/customFields/${id}`,
    delete: (id: string) => `/locations/{locationId}/customFields/${id}`,
  },

  // Custom Objects (if available)
  customObjects: {
    listSchemas: "/custom-objects/schemas",
    getSchema: (schemaKey: string) => `/custom-objects/schemas/${schemaKey}`,
    createSchema: "/custom-objects/schemas",
    listRecords: (schemaKey: string) => `/custom-objects/schemas/${schemaKey}/records`,
    getRecord: (schemaKey: string, recordId: string) => `/custom-objects/schemas/${schemaKey}/records/${recordId}`,
    createRecord: (schemaKey: string) => `/custom-objects/schemas/${schemaKey}/records`,
    updateRecord: (schemaKey: string, recordId: string) => `/custom-objects/schemas/${schemaKey}/records/${recordId}`,
    deleteRecord: (schemaKey: string, recordId: string) => `/custom-objects/schemas/${schemaKey}/records/${recordId}`,
  },

  // Locations (Sub-accounts)
  locations: {
    get: (id: string) => `/locations/${id}`,
    update: (id: string) => `/locations/${id}`,
    search: "/locations/search",
    getTags: (id: string) => `/locations/${id}/tags`,
    createTag: (id: string) => `/locations/${id}/tags`,
    getTag: (locationId: string, tagId: string) => `/locations/${locationId}/tags/${tagId}`,
    updateTag: (locationId: string, tagId: string) => `/locations/${locationId}/tags/${tagId}`,
    deleteTag: (locationId: string, tagId: string) => `/locations/${locationId}/tags/${tagId}`,
    // Templates
    listTemplates: (id: string) => `/locations/${id}/templates`,
  },

  // Users
  users: {
    search: "/users/search",
    get: (id: string) => `/users/${id}`,
    create: "/users/",
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  // Forms & Surveys
  forms: {
    list: "/forms/",
    getSubmissions: "/forms/submissions",
  },
  surveys: {
    list: "/surveys/",
    getSubmissions: "/surveys/submissions",
  },

  // Campaigns
  campaigns: {
    list: "/campaigns/",
  },

  // Social Media Planner
  socialMedia: {
    listPosts: "/social-media-posting/",
    getPost: (id: string) => `/social-media-posting/${id}`,
    createPost: "/social-media-posting/",
    deletePost: (id: string) => `/social-media-posting/${id}`,
    listAccounts: "/social-media-posting/oauth/",
  },

  // Blogs
  blogs: {
    list: "/blogs/",
    getBlog: (id: string) => `/blogs/${id}`,
    listPosts: (blogId: string) => `/blogs/${blogId}/posts`,
    createPost: (blogId: string) => `/blogs/${blogId}/posts`,
    updatePost: (blogId: string, postId: string) => `/blogs/${blogId}/posts/${postId}`,
  },

  // Media Library
  media: {
    list: "/medias/",
    upload: "/medias/upload",
    delete: (id: string) => `/medias/${id}`,
  },

  // Funnels & Websites
  funnels: {
    list: "/funnels/funnel/list",
    listPages: "/funnels/page",
  },

  // Trigger Links
  links: {
    list: "/links/",
    create: "/links/",
    update: (id: string) => `/links/${id}`,
    delete: (id: string) => `/links/${id}`,
  },
} as const;
