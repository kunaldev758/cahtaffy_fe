import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Plan limits count only invited team (HumanAgent with isClient !== true), not the account owner (Admin) row. */
export function countBillableHumanAgents<T extends { isClient?: boolean }>(
  agents: T[] | undefined | null
): number {
  if (!Array.isArray(agents)) return 0
  return agents.filter((a) => !a.isClient).length
}
