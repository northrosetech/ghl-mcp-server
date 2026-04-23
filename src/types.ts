// GHL MCP Server Type Definitions
// ================================

export interface GHLApiResponse<T = unknown> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  // Some endpoints return data at root level
  contacts?: T[];
  conversations?: T[];
  opportunities?: T[];
  [key: string]: unknown;
}

export interface PaginationMeta {
  total?: number;
  count?: number;
  startAfter?: string;
  startAfterId?: string;
  currentPage?: number;
  nextPage?: number;
  prevPage?: number;
}

export interface GHLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  tags?: string[];
  source?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  dateOfBirth?: string;
  dnd?: boolean;
  customFields?: GHLCustomFieldValue[];
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GHLCustomFieldValue {
  id: string;
  key?: string;
  field_value?: string;
  value?: string;
}

export interface GHLConversation {
  id: string;
  locationId: string;
  contactId: string;
  type?: string;
  unreadCount?: number;
  lastMessageBody?: string;
  lastMessageDate?: string;
  lastMessageType?: string;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GHLMessage {
  id: string;
  conversationId: string;
  locationId: string;
  contactId: string;
  type: string;
  direction: string;
  status: string;
  body?: string;
  dateAdded: string;
  [key: string]: unknown;
}

export interface GHLCalendar {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  widgetType?: string;
  calendarType?: string;
  [key: string]: unknown;
}

export interface GHLEvent {
  id: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  title?: string;
  status?: string;
  startTime: string;
  endTime: string;
  [key: string]: unknown;
}

export interface GHLOpportunity {
  id: string;
  locationId: string;
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  status: string;
  monetaryValue?: number;
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GHLPipeline {
  id: string;
  locationId: string;
  name: string;
  stages: GHLPipelineStage[];
  [key: string]: unknown;
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  position?: number;
  [key: string]: unknown;
}

export interface GHLWorkflow {
  id: string;
  locationId: string;
  name: string;
  status?: string;
  [key: string]: unknown;
}

export interface GHLInvoice {
  id: string;
  locationId: string;
  contactId?: string;
  name?: string;
  title?: string;
  status: string;
  total?: number;
  amountDue?: number;
  currency?: string;
  dueDate?: string;
  dateAdded?: string;
  [key: string]: unknown;
}

export interface GHLLocation {
  id: string;
  name: string;
  companyId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface GHLCustomField {
  id: string;
  name: string;
  fieldKey: string;
  dataType: string;
  placeholder?: string;
  position?: number;
  [key: string]: unknown;
}

export interface GHLTag {
  id: string;
  name: string;
  locationId: string;
  [key: string]: unknown;
}

export interface GHLNote {
  id: string;
  body: string;
  contactId: string;
  dateAdded?: string;
  [key: string]: unknown;
}

export interface GHLTask {
  id: string;
  title: string;
  body?: string;
  contactId: string;
  dueDate?: string;
  completed?: boolean;
  assignedTo?: string;
  [key: string]: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
