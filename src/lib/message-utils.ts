import { v4 as uuidv4 } from 'uuid';

interface MessageMetadata {
  attemptId: string;
  originalMessageId: string;
  timestamp: number;
}

const messageRegistry = new Set<string>();
const MESSAGE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

export function generateMessageId(): string {
  return uuidv4();
}

export function isMessageDuplicate(messageId: string): boolean {
  return messageRegistry.has(messageId);
}

export function registerMessage(messageId: string) {
  messageRegistry.add(messageId);
  
  // Remove the message ID from registry after expiry time
  setTimeout(() => {
    messageRegistry.delete(messageId);
  }, MESSAGE_EXPIRY_TIME);
}

export function createMessageMetadata(): MessageMetadata {
  return {
    attemptId: uuidv4(),
    originalMessageId: uuidv4(),
    timestamp: Date.now()
  };
}
