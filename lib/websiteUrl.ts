type AgentWebsiteFields = {
  _id?: string
  agentName?: string
  website_name?: string
  onboardingWebsiteUrl?: string
  onboardingExtractedUrls?: string[]
}

function looksLikeHostnameOrDomain(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.includes('.')) return false
  return /^[\w.-]+\.[\w.-]+$/i.test(trimmed)
}

export function hostnameFromUrlLike(input: string): string {
  if (!input?.trim()) return ''
  const s = input.trim()
  try {
    const url = s.includes('://') ? new URL(s) : new URL(`https://${s.replace(/^\/\//, '')}`)
    return (url.hostname || '').replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function collectWebsiteHostsFromAgent(agent: AgentWebsiteFields): Set<string> {
  const hosts = new Set<string>()
  const add = (value?: string) => {
    const host = hostnameFromUrlLike(value || '')
    if (host) hosts.add(host)
  }

  add(agent.onboardingWebsiteUrl)
  add(agent.website_name)
  if (agent.agentName && looksLikeHostnameOrDomain(agent.agentName)) {
    add(agent.agentName)
  }
  if (Array.isArray(agent.onboardingExtractedUrls)) {
    for (const url of agent.onboardingExtractedUrls) {
      add(url)
    }
  }

  return hosts
}

export function findDuplicateWebsiteAgent(
  agents: AgentWebsiteFields[],
  websiteUrl: string,
  excludeAgentId?: string | null,
): AgentWebsiteFields | null {
  const targetHost = hostnameFromUrlLike(websiteUrl)
  if (!targetHost) return null

  for (const agent of agents) {
    if (excludeAgentId && agent._id === excludeAgentId) continue
    if (collectWebsiteHostsFromAgent(agent).has(targetHost)) {
      return agent
    }
  }

  return null
}
