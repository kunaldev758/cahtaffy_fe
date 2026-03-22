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
    feedback?: boolean | null;
    comment?: string;
    agentId?: string | {
      _id: string;
      name: string;
      avatar?: string;
    };
  }
  
  export interface MessageSource {
    type: number | null; // 0=WebPage, 1=File, 2=Snippet, 3=FAQ, 4=RevisedAnswer
    title: string | null;
    url: string | null;
  }

  export interface Message {
    _id: string;
    message: string;
    sender_type: string;
    is_note?: string;
    createdAt: string;
    conversation_id: string;
    infoSources?: MessageSource[] | string[];
    agentId?: {
      _id: string;
      name: string;
      avatar?: string;
      isClient?: boolean;
    };
    humanAgentId?: {
      _id: string;
      name: string;
      avatar?: string;
      isClient?: boolean;
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