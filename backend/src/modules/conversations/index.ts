/**
 * Conversations module
 * Listing-based chat between tenants and property owners
 */

import controller from './controllers/conversation.controller';

export default controller;

// Re-export service functions for use by other modules (e.g., property unlock)
export { createConversationOnUnlock } from './services/conversation.service';

// Re-export WebSocket utilities for use by notification service
export { pushToUser } from './ws/ws-registry';
