/**
 * Maxxit Lazy Trader API Client
 */

import type { ClubDetailsResponse, SendMessageResponse, MaxxitApiOptions } from './types';

const DEFAULT_BASE_URL = '/api/maxxit';
const API_KEY_HEADER = 'x-api-key';

/**
 * Fetch Lazy Trader agent details
 */
export async function fetchClubDetails(
  apiKey: string,
  options?: MaxxitApiOptions
): Promise<ClubDetailsResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
  
  const response = await fetch(`${baseUrl}/club-details`, {
    method: 'GET',
    headers: {
      [API_KEY_HEADER]: apiKey,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch club details');
  }

  return data;
}

/**
 * Send a message to the Lazy Trader agent
 */
export async function sendMessageToAgent(
  apiKey: string,
  message: string,
  options?: MaxxitApiOptions
): Promise<SendMessageResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
  
  const response = await fetch(`${baseUrl}/send-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [API_KEY_HEADER]: apiKey,
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to send message');
  }

  return data;
}
