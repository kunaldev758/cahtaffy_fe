export interface Conversation {
    _id: string;
    visitor: {
      _id: string;
      name: string;
      lastMessage?: string;
      visitorDetails?: Array<{ field: string; value: string }>;
      location?: string;
      ip?: string;
    };
    lastMessage?: string;
    updatedAt: string;
    createdAt?: string;
    newMessage: number;
    is_started: boolean;
    aiChat: boolean;
    agentId?: string | {
      _id: string;
      name: string;
      avatar?: string;
    };
  }
  
  export interface Message {
    _id: string;
    message: string;
    sender_type: string;
    is_note?: string;
    createdAt: string;
    conversation_id: string;
    agentId?: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }
  
  export interface Tag {
    _id: string;
    name: string;
  }
  
  export interface Note {
    _id: string;
    message: string;
    createdAt: string;
  }

export interface Client {
    _id: string;
    userId: string;
    email: string;
    isActive?: boolean;
    lastActive?: Date | string | null;
  }