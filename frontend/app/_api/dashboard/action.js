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
export async function getMessageSources(trainingListIds) {
  return await fetchData('getMessageSources', { trainingListIds });
}

export async function getBasicInfoApi(basicInfo) {
  return await fetchData('getBasicInfo', { basicInfo });
}
export async function setBasicInfoApi(basicInfo) {
  return await fetchData('setBasicInfo', { basicInfo });
}

export async function logoutApi() {
  cookies().delete('token')
  return await fetchData('logout');
}