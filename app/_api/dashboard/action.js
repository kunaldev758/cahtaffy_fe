'use server'
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'

async function fetchData(endpoint, requestData = {}) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      Authorization: cookies().get('token').value
    },
    body: JSON.stringify(requestData)
  });
  const data = await response.json();
  console.log(response,"status code")
  if(data.status_code==401){
    // cookies().delete('token')
    return 'error'
  }
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
  const data = await response.json();
  console.log(response,"status code")
  if(data.status_code==401){
    // cookies().delete('token')
    return 'error'
  }
  return data
}


async function uploadData(endpoint,formData,userId ) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}/${userId}`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: cookies().get('token').value
    },
  });
  const data = await response.json();
  console.log(response,"status code")
  if(data.status_code==401){
    // cookies().delete('token')
    return 'error'
  }
  return data
}

async function getFetchData(endpoint,params=null) {
  let response =null; 
  if(params){
    console.log(params,"params")
  response = await fetch(`${process.env.API_HOST}${endpoint}/${params}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      Authorization: cookies().get('token').value
    },
  });
}else{
  response = await fetch(`${process.env.API_HOST}${endpoint}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      Authorization: cookies().get('token').value
    },
  });
}
  const data = await response.json();
  if(data.status_code==401){
    // cookies().delete('token')
    return 'error'
  }
  return data
}




export async function openaiWebPageScrapeApi(sitemap) {
  return await fetchData('openaiScrape', { sitemap });
}

export async function openaiCreateSnippet(formData) {
  console.log(formData, "form data");
  const response = await fetch(`${process.env.API_HOST}openaiCreateSnippet`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Authorization: cookies().get('token').value
    },
    body: formData
  });
  const data = await response.json();
  if(data.status_code==401){
    // cookies().delete('token')
    return 'error'
  }
  return data
}

export async function openaiCreateFaq(question, answer) {
  return await fetchData('openaiCreateFaq', { question, answer });
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


export async function getBasicInfoApi(basicInfo) {
  return await fetchData('getBasicInfo', { basicInfo });
}
export async function setBasicInfoApi(basicInfo) {
  return await fetchData('setBasicInfo', { basicInfo });
}

export async function getThemeSettings(id) {
  return await getFetchData('getThemeSettings',id);
}

export async function uploadLogo(formData,userId) {
  return await uploadData('uploadLogo',formData,userId);
}

export async function updateThemeSettings(themeSettings) {
  return await fetchData('updateThemeSettings', { themeSettings });
}


export async function logoutApi() {
  cookies().delete('token')
  return await fetchData('logout');
}

// Agent API functions
export async function getAllAgents() {
  const data = await getFetchData('agents');
  console.log('getAllAgents response:', data);
  return data;
}

export async function createAgent(agentData) {
  return await fetchData('agents', agentData);
}

export async function updateAgent(id, agentData) {
  return await fetchData(`agents/${id}`, agentData);
}

export async function toggleActiveStatus(id,status) {
  return await fetchData(`agents/${id}/status`,{isActive:status});
}

export async function deleteAgent(id) {
  if (!id) {
    console.error('Delete agent called without an ID');
    throw new Error('Agent ID is required');
  }
  return await fetchData(`agents/delete/${id}`);
}


export async function updateAgentStatus(id, isActive) {
  return await fetchData(`agents/${id}/status`, { isActive });
}

export async function agentAcceptInviteVerify(token) {
  return await fetchDatawithoutToken(`/agents/accept-invite/${token}`);
}
