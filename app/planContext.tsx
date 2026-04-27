"use client";
import React, { useContext, useEffect, useState } from 'react'
import { createContext } from 'react';
import { useSocket } from './socketContext';
import axios from 'axios';
import { getVisitorLocation } from './_api/dashboard/action';

interface PlanContextProps {
  plan: any;
  setPlan: (plan: any) => void;
  effectiveLimits: any;
  setEffectiveLimits: (effectiveLimits: any) => void;
}

const PlanContext = createContext<PlanContextProps | null>(null);
function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<any>(null);
  const [effectiveLimits, setEffectiveLimits] = useState<any>(null);
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return
    const handleEffectiveLimitsUpdated = (response: any) => {
      if (response.success) {
        setEffectiveLimits(response.effectiveLimits)
        setPlan(response.plan ? response.plan : null)
      }
    }
    socket.emit("fetch-effective-limits", {}, (response: any) => { 
      if (response.success) {
        setEffectiveLimits(response.effectiveLimits)
        setPlan(response.plan ? response.plan : null)
      }
    })

  // this event handle when the admin change the effective limits
    socket.on("effective-limits-updated", handleEffectiveLimitsUpdated)
    return () => {
      socket.off("effective-limits-updated", handleEffectiveLimitsUpdated)
    }
  }, [socket])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (async () => {
        try {
          const response = await getVisitorLocation();  
          window.localStorage.setItem("userCountry", response.country);
        } catch (error) {
        }
      })()
    }
  }, [])

  return (
    <PlanContext.Provider value={{ plan, setPlan, effectiveLimits, setEffectiveLimits }}>
      {children}
    </PlanContext.Provider>
  )
}

export default PlanProvider
export const usePlanContext = () => useContext(PlanContext) as PlanContextProps;