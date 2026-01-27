/**
 * Maxxit Lazy Trader API Client
 * 4-step wallet-based setup flow
 */

import type {
  GenerateAgentResponse,
  GenerateTelegramLinkResponse,
  CheckTelegramStatusResponse,
  CreateAgentResponse,
  CheckSetupResponse,
  TradingPreferences,
  LazyTraderApiOptions,
} from './types';

const DEFAULT_BASE_URL = '/api/maxxit';

export async function generateOstiumAgent(
  userWallet: string,
  options?: LazyTraderApiOptions
): Promise<GenerateAgentResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}/generate-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userWallet, isTestnet: true }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate agent');
  }

  return data;
}

export async function generateTelegramLink(
  userWallet: string,
  options?: LazyTraderApiOptions
): Promise<GenerateTelegramLinkResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}/generate-telegram-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userWallet, isTestnet: true }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate telegram link');
  }

  return data;
}

export async function checkTelegramStatus(
  userWallet: string,
  linkCode: string,
  options?: LazyTraderApiOptions
): Promise<CheckTelegramStatusResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  const url = new URL(`${baseUrl}/check-telegram-status`, window.location.origin);
  url.searchParams.set('userWallet', userWallet);
  url.searchParams.set('linkCode', linkCode);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check telegram status');
  }

  return data;
}

export async function createLazyTraderAgent(
  userWallet: string,
  telegramAlphaUserId: string,
  tradingPreferences: TradingPreferences,
  options?: LazyTraderApiOptions
): Promise<CreateAgentResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}/create-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userWallet,
      telegramAlphaUserId,
      tradingPreferences,
      isTestnet: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create agent');
  }

  return data;
}

export async function checkSetup(
  userWallet: string,
  options?: LazyTraderApiOptions
): Promise<CheckSetupResponse> {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  const url = new URL(`${baseUrl}/check-setup`, window.location.origin);
  url.searchParams.set('userWallet', userWallet);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check setup');
  }

  return data;
}
