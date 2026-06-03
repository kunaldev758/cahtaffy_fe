'use server'
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AGENT_TOKEN,
  CLIENT_TOKEN,
  LEGACY_TOKEN,
  portalFromHostname,
  serverAuthCookieOpts,
} from '@/lib/authCookies';
import {
  AUTH_API_ERROR,
  isUnauthorizedResponse,
  loginPathForPortal,
  SESSION_EXPIRED_QUERY,
} from '@/lib/apiAuth';

const cookieOpts = () => serverAuthCookieOpts();

function clearClientAuthCookies() {
  cookies().delete(CLIENT_TOKEN);
  cookies().delete(LEGACY_TOKEN);
  cookies().delete('role');
  // Important: do NOT clear sf_token / bc_token here.
  // Web logout should not log the user out from embedded Shopify/BigCommerce tabs.
}

function clearAgentAuthCookies() {
  cookies().delete(AGENT_TOKEN);
  cookies().delete(LEGACY_TOKEN);
  cookies().delete('role');
}

async function handleUnauthorized() {
  const portal = resolveAuthPortal();
  if (portal === 'agent') {
    await logoutAgentApi();
    redirect(
      `${loginPathForPortal('agent')}?${SESSION_EXPIRED_QUERY}=1`,
    );
  }
  await logoutApi();
  redirect(
    `${loginPathForPortal('client')}?${SESSION_EXPIRED_QUERY}=1`,
  );
}

async function parseApiJson(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (isUnauthorizedResponse(response, data)) {
    await handleUnauthorized();
  }
  if (
    data &&
    typeof data === 'object' &&
    !response.ok &&
    data.status_code == null
  ) {
    data.status_code = response.status;
    if (data.status == null) data.status = false;
  }
  return data;
}

// export async function logoutApi() {
//   const authHeader = getAuthorizationHeader();
//   clearClientAuthCookies();
//   try {
//     await fetch(`${process.env.API_HOST}logout`, {
//       method: 'POST',
//       cache: 'no-cache',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: authHeader,
//       },
//     });
//   } catch {
//     /* cookie clear is enough for UI */
//   }
// }

export async function logoutApi() {
  const authHeader = getAuthorizationHeader();
  // Web logout only: clear local client session cookies.
  clearClientAuthCookies();
  // Reset platform so top-level web is treated as local/anonymous.
  cookies().delete("platform");

  try {
    await fetch(`${process.env.API_HOST}logout`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({}),
    });
  } catch (error) {
    console.error("Logout API failed:", error);
    // Cookie clear is enough for UI
  }
}

function getPlatformCookieName() {
  const platform = cookies().get('platform')?.value || 'local';
  if (platform === 'shopify') return 'sf_token';
  if (platform === 'bigcommerce') return 'bc_token';
  return CLIENT_TOKEN;
}

export const getClientToken = async () => {
  const platform = cookies().get('platform')?.value || 'local';
  if (platform === 'shopify') {
    return cookies().get('sf_token')?.value || null;
  }
  if (platform === 'bigcommerce') {
    return cookies().get('bc_token')?.value || null;
  }
  return (
    cookies().get(CLIENT_TOKEN)?.value ||
    cookies().get(LEGACY_TOKEN)?.value ||
    null
  );
};



export const getAgentToken = async () => {
  return (
    cookies().get(AGENT_TOKEN)?.value ||
    cookies().get(LEGACY_TOKEN)?.value ||
    null
  );
};

/** Client dashboard session (backward-compatible name). */
export const getToken = async () => getClientToken();

/** Pick client vs agent session for server-side API calls (by host / referer). */
// function resolveAuthPortal() {
//   const host = (headers().get('host') || '').split(':')[0];

//   console.log("Resolving auth portal. Host:", host);
//   const fromHost = portalFromHostname(host);

//   console.log("Portal from hostname:", fromHost);
//   if (fromHost === 'agent') return 'agent';
//   if (fromHost === 'client') return 'client';

//   const referer = headers().get('referer') || '';

//   console.log("Resolving auth portal. Host:", host, "Referer:", referer);
//   if (
//     referer.includes('/agent-inbox') ||
//     referer.includes('/agent-login') ||
//     referer.includes('/agent-accept-invite')
//   ) {
//     return 'agent';
//   }
//   return 'client';
// }

function resolveAuthPortal() {
  const host = (headers().get('host') || '').split(':')[0];

  // Handle local development
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    const referer = headers().get('referer') || '';

    console.log("Resolving auth portal in local environment. Host:", host, "Referer:", referer);
    if (
      referer.includes('/agent-inbox') ||
      referer.includes('/agent-login') ||
      referer.includes('/agent-accept-invite')
    ) {
      return 'agent';
    }
    return 'client';
  }

  const fromHost = portalFromHostname(host);
  if (fromHost === 'agent') return 'agent';
  if (fromHost === 'client') return 'client';

  const referer = headers().get('referer') || '';
  if (
    referer.includes('/agent-inbox') ||
    referer.includes('/agent-login') ||
    referer.includes('/agent-accept-invite')
  ) {
    return 'agent';
  }
  return 'client';
}

function getAuthorizationHeader() {
  const portal = resolveAuthPortal();

  if (portal === 'agent') {
    return (
      cookies().get(AGENT_TOKEN)?.value ||
      cookies().get(LEGACY_TOKEN)?.value ||
      ''
    );
  }

  const platform = cookies().get('platform')?.value || 'local';
  if (platform === 'shopify') {
    return cookies().get('sf_token')?.value || '';
  }
  if (platform === 'bigcommerce') {
    return cookies().get('bc_token')?.value || '';
  }
  return (
    cookies().get(CLIENT_TOKEN)?.value ||
    cookies().get(LEGACY_TOKEN)?.value ||
    ''
  );
}

function syncTokenFromSetCookieHeader(setCookieHeader) {
  if (!setCookieHeader) return;

  const names = [getPlatformCookieName(), CLIENT_TOKEN, AGENT_TOKEN, LEGACY_TOKEN];
  for (const cookieName of names) {
    const token = setCookieHeader.match(
      new RegExp(`(?:^|,\\s*)${cookieName}=([^;]+)`),
    )?.[1];
    if (token) {
      cookies().set({ name: cookieName, value: token, ...cookieOpts() });
      return;
    }
  }
}

async function fetchData(endpoint, requestData = {}) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthorizationHeader()
    },
    body: JSON.stringify(requestData)
  });
  const data = await parseApiJson(response);
  const setCookie = response.headers.get('set-cookie');
  syncTokenFromSetCookieHeader(setCookie);
  return data
}
async function fetchDatawithoutToken(endpoint, requestData = {}) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });
  return await parseApiJson(response);
}


async function uploadData(endpoint, formData, userId) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}/${userId}`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: getAuthorizationHeader()
    },
  });
  const data = await parseApiJson(response);
  const setCookie = response.headers.get('set-cookie');
  syncTokenFromSetCookieHeader(setCookie);
  return data
}

async function getFetchData(endpoint, params = null) {

  console.log(`Fetching data ${process.env.API_HOST} from endpoint: ${endpoint} with params:`, params);
  let response = null;
  if (params) {
    response = await fetch(`${process.env.API_HOST}${endpoint}/${params}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthorizationHeader()
      },
    });
  } else {
    response = await fetch(`${process.env.API_HOST}${endpoint}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthorizationHeader()
      },
    });
  }
  const data = await parseApiJson(response);

  console.log(`Received response from ${endpoint}:`, data);
  const setCookie = response.headers.get('set-cookie');
  syncTokenFromSetCookieHeader(setCookie);
  return data
}




export async function getSitemapUrlsApi(sitemapUrl, agentId) {
  return await fetchData('getSitemapUrls', {
    sitemapUrl,
    agentId,
    skipBulkInsert: true,
  });
}

export async function startSitemapScrapingApi(agentId, urls) {
  return await fetchData('openaiScrape', { agentId, urls });
}

export async function openaiWebPageScrapeApi(sitemap, isNotSitemap, agentId) {
  if (isNotSitemap) {
    const url = sitemap;
    const urls = typeof url === 'string' ? url.split(',').map((u) => u.trim()).filter(Boolean) : [];
    return await startSitemapScrapingApi(agentId, urls);
  } else {
    const sitemapUrl = sitemap;
    const res = await getSitemapUrlsApi(sitemapUrl, agentId);
    if (res?.success && Array.isArray(res.urls) && res.urls.length > 0) {
      return await startSitemapScrapingApi(agentId, res.urls);
    }
    return res;
  }
}

export async function openaiCreateSnippet(formData, agentId) {
  if (agentId) {
    formData.append('agentId', agentId);
  }
  const response = await fetch(`${process.env.API_HOST}openaiCreateSnippet`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Authorization: getAuthorizationHeader()
    },
    body: formData
  });
  const data = await parseApiJson(response);
  const setCookie = response.headers.get('set-cookie');
  syncTokenFromSetCookieHeader(setCookie);
  return data
}

export async function openaiCreateFaq(faqs, agentId) {
  return await fetchData('openaiCreateFaq', { faqs, agentId });
}

/**
 * Delete training data by IDs. Runs in background.
 * @param {string[]} ids - Array of training entry _ids
 * @param {string} agentId - Agent ID
 */
export async function deleteTrainingDataApi(ids, agentId) {
  return await fetchData('deleteTrainingData', { ids, agentId });
}

/**
 * Retrain training data by IDs. Only webpages are retrained. Runs in background.
 * @param {string[]} ids - Array of training entry _ids
 * @param {string} agentId - Agent ID
 */
export async function retrainTrainingDataApi(ids, agentId) {
  return await fetchData('retrainTrainingData', { ids, agentId });
}

export async function openaiToggleActiveStatus(id) {
  return await fetchData('openaiToggleActiveStatus', { id });
}

export async function getWidgetToken() {
  return await fetchData('getWidgetToken');
}

export async function getOpenaiTrainingListDetail(id) {
  return await fetchData('getOpenaiTrainingListDetail', { id });
}

export async function getTrainingStatus(basicInfo) {
  return await fetchData('getTrainingStatus', { basicInfo });
}





export async function getConversationMessages(id) {
  return await fetchData('getConversationMessages', { id });
}

export async function getOldConversationMessages(id) {
  return await fetchData('getOldConversationMessages', { id });
}

export async function getMessageSources(trainingListIds) {
  return await fetchData('getMessageSources', { trainingListIds });
}

export async function reviseAnswer(data) {
  return await fetchData('revise-answer', data);
}


export async function getBasicInfoApi(basicInfo) {
  return await fetchData('getBasicInfo', { basicInfo });
}
export async function setBasicInfoApi(basicInfo) {
  return await fetchData('setBasicInfo', { basicInfo });
}

export async function getThemeSettings(id) {
  return await getFetchData('getThemeSettings', id);
}

export async function uploadLogo(formData, userId) {
  return await uploadData('uploadLogo', formData, userId);
}

export async function updateThemeSettings(data) {
  return await fetchData('updateThemeSettings', data);
}

export async function getAgentSettingsApi(agentId) {
  return await getFetchData('agent-settings', agentId);
}

export async function updateAgentSettingsApi(data) {
  return await fetchData('updateAgentSettings', data);
}

/**
 * Persist the current onboarding step for an agent so that a page refresh
 * restores the user to the correct screen.
 * @param {string} agentId
 * @param {'source'|'train'|'widget'} step
 * @param {string} [websiteUrl]
 * @param {string[]} [extractedUrls]
 */
export async function updateOnboardingStepApi(agentId, step, websiteUrl, extractedUrls) {
  const payload = { agentId, onboardingStep: step };
  if (websiteUrl !== undefined) payload.onboardingWebsiteUrl = websiteUrl;
  if (extractedUrls !== undefined) payload.onboardingExtractedUrls = extractedUrls;
  return await fetchData('updateAgentSettings', payload);
}



export async function logoutAgentApi() {
  clearAgentAuthCookies();
  try {
    await fetch(`${process.env.API_HOST}agents/logout`, {
      method: 'POST',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    /* cookie clear is enough for UI */
  }
}

// Human Agent API functions
export async function getAllHumanAgents() {
  return await getFetchData('agents');
}

// AI Agents (websites) - for assignedAgents dropdown
export async function getAIAgents() {
  const data = await getFetchData('ai-agents');
  if (data === AUTH_API_ERROR) return [];
  return Array.isArray(data?.agents) ? data.agents : (Array.isArray(data) ? data : []);
}

export async function getAgentData(agentId) {
  console.log("agentId from getAgentData ->", agentId)
  return await getFetchData(`ai-agents/agent-data/${agentId}`);
}

export async function createHumanAgent(agentData) {
  return await fetchData('agents', agentData);
}

export async function updateHumanAgent(id, agentData) {
  return await fetchData(`agents/${id}`, agentData);
}

// Legacy aliases for backward compatibility
export async function getAllAgents() {
  return getAllHumanAgents();
}

export async function createAgent(agentData) {
  return createHumanAgent(agentData);
}

export async function updateAgent(id, agentData) {
  return updateHumanAgent(id, agentData);
}

export async function toggleActiveStatus(id, status) {
  return await fetchData(`agents/${id}/status`, { isActive: status });
}

export async function deleteAgent(id) {
  if (!id) {
    console.error('Delete agent called without an ID');
    throw new Error('Agent ID is required');
  }
  return await fetchData(`agents/delete/${id}`);
}

export async function resendMailToAgent(id){

  if (!id) {
    console.error('Resend mail to agent called without an ID');
    throw new Error('Agent ID is required');
  }
  return await fetchData(`agents/resend-mail/${id}`);
}


export async function updateAgentStatus(id, isActive) {
  return await fetchData(`agents/${id}/status`, { isActive });
}

export async function updateClientStatus(isActive) {
  return await fetchData(`clients/status`, { isActive });
}

export async function uploadAgentAvatar(formData, agentId) {
  const response = await fetch(`${process.env.API_HOST}agents/${agentId}/avatar`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: getAuthorizationHeader()
    },
  });
  const data = await parseApiJson(response);
  const setCookie = response.headers.get('set-cookie');
  syncTokenFromSetCookieHeader(setCookie);
  return data
}

export async function agentAcceptInviteVerify(token) {
  return await fetchDatawithoutToken(`/agents/accept-invite/${token}`);
}


export async function getDataField(id) {
  return await getFetchData(`/getDataField/${id}`);
}

export async function getPlans() {
  return await getFetchData(`/available`);
}

// export async function getClientData() {
//   const data = await fetchData('client');
//   return data;
// }

export async function getClientData() {
  const data = await fetchData('client');
  if (!data || data === AUTH_API_ERROR) return data;
  // HumanAgent (isClient) holds inbox status; Client doc is billing/plan only.
  const clientAgent = data.clientAgent ?? data.client;
  if (clientAgent) {
    return { ...data, clientAgent };
  }
  return data;
}

export async function getClientProfile() {
  return await fetchData('client/profile');
}

export async function updateClientProfileGeneral(payload) {
  return await fetchData('client/profile/general', payload);
}

export async function updateClientPassword(payload) {
  return await fetchData('client/profile/password', payload);
}

export async function continueScrapping() {
  const data = await fetchData('continueAfterUpgrade');
  return data;
}

export async function upgradePlan(newPlan) {
  return await fetchData(`upgradePlan`, { newPlan });
}

export async function capturePayment(orderID, plan, billing_cycle) {
  return await fetchData(`paypal/capture-payment`, { orderID, plan, billing_cycle })
}

export async function createOrder(value, currency, plan_name, billing_cycle) {
  return await fetchData(`paypal/create-order`, { value, currency, plan_name, billing_cycle })
}

export async function sendEmailForOfflineChat(visitorDetails, contactNote, userId) {
  return await fetchDatawithoutToken(`sendEmailForOfflineChat`, { message: contactNote, visitorDetails: visitorDetails, userId: userId });
}

export async function toggleWidgetStatusApi(agentId, isActive) {
  return await fetchData('widget/toggle-status', { agentId, isActive });
}

export async function leaveAMessage(payload) {
  return await fetchDatawithoutToken('leaveMessage', payload);
}

export async function getChatTranscriptSettings() {
  return await fetchData('chat-transcripts/settings/get');
}

export async function updateChatTranscriptSettings(payload) {
  return await fetchData('chat-transcripts/settings/update', payload);
}

export async function getVisitorLocation() {
  const response = await fetch(process.env.IPINFO_URL, {
    method: 'GET',
    cache: 'no-cache',
  });
  const data = await response.json();
  return data;
}
