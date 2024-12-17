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
    cookies().delete('token')
    return 'error'
  }
  return data
}

async function uploadData(endpoint,formData ) {
  const response = await fetch(`${process.env.API_HOST}${endpoint}`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: cookies().get('token').value
    },
  });
  const data = await response.json();
  console.log(response,"status code")
  if(data.status_code==401){
    cookies().delete('token')
    return 'error'
  }
  return data
}

async function getFetchData(endpoint,params=null) {
  let response =null;
  if(params){
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
    cookies().delete('token')
    return 'error'
  }
  return data
}

export async function webPageScrapeApi(sitemap) {
  return await fetchData('scrape', { sitemap });
}
export async function openaiWebPageScrapeApi(sitemap) {
  return await fetchData('openaiScrape', { sitemap });
}
export async function tensorflowWebPageScrapeApi(sitemap) {
  return await fetchData('tensorflowScrape', { sitemap });
}

export async function openaiCreateSnippet(formData) {
  console.log(formData, "form data");
  // return await fetchData('openaiCreateSnippet', formData);
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
    cookies().delete('token')
    return 'error'
  }
  return data
}
export async function tensorflowCreateSnippet(title, content) {
  return await fetchData('tensorflowCreateSnippet', { title, content });
}
export async function openaiCreateFaq(question, answer) {
  return await fetchData('openaiCreateFaq', { question, answer });
}
export async function tensorflowCreateFaq(question, answer) {
  return await fetchData('tensorflowCreateFaq', { question, answer });
}
export async function openaiToggleActiveStatus(id) {
  return await fetchData('openaiToggleActiveStatus', { id });
}
export async function tensorflowToggleActiveStatus(id) {
  return await fetchData('tensorflowToggleActiveStatus', { id });
}

export async function getWidgetToken() {
  return await fetchData('getWidgetToken');
}

export async function getTrainingListDetail(id) {
  return await fetchData('getTrainingListDetail', { id });
}
export async function getOpenaiTrainingListDetail(id) {
  return await fetchData('getOpenaiTrainingListDetail', { id });
}
export async function getTensorflowTrainingListDetail(id) {
  return await fetchData('getTensorflowTrainingListDetail', { id });
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

export async function addConversationToArchive(basicInfo) {
  return await fetchData('addConversationToArchive', { basicInfo });
}

export async function getTrainingStatus(basicInfo) {
  return await fetchData('getTrainingStatus', { basicInfo });
}

export async function blockVisitor(basicInfo) {
  return await fetchData('blockVisitor', { basicInfo });
}

export async function saveVisitorDetails(basicInfo) {
  return await fetchData('saveVisitorDetails', { basicInfo });
}

export async function getBasicInfoApi(basicInfo) {
  return await fetchData('getBasicInfo', { basicInfo });
}
export async function setBasicInfoApi(basicInfo) {
  return await fetchData('setBasicInfo', { basicInfo });
}

export async function getThemeSettings(id) {
  return await getFetchData('getThemeSettings',{id});
}

export async function uploadLogo(formData) {
  return await uploadData('uploadLogo',formData);
}

export async function getIsVisitorExists(id) {
  return await getFetchData('getIsVisitorExists',{id});
}

export async function updateThemeSettings(themeSettings) {
  return await fetchData('updateThemeSettings', { themeSettings });
}

export async function getAllNotesOfConversation(basicInfo) {
  return await fetchData('getAllNoteToConveration',  {basicInfo} );
}

export async function getSearchConversationList(basicInfo) {
  return await fetchData('getSearchConversationList', { basicInfo });
}

export async function getAllOldConversationOfVisitor(basicInfo) {
  return await fetchData('getAllOldConversationOfVisitor', { basicInfo });
}

export async function getVisitorDetails(basicInfo) {
  return await fetchData('getVisitorDetails', { basicInfo });
}

export async function getConversationTags(basicInfo) {
  return await fetchData('getConversationTags', { basicInfo });
}

export async function removeTagFromConversation(basicInfo) {
  return await fetchData('removeTagFromConversation', { basicInfo });
}

export async function addTagToConversation(basicInfo) {
  return await fetchData('addTagToConversation', { basicInfo });
}

export async function logoutApi() {
  cookies().delete('token')
  return await fetchData('logout');
}