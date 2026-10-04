// FILE: src/components/AgentTracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureRef, notePage, startAgentSession } from '../lib/agent';

const AgentTracker = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    captureRef(search);
    startAgentSession();
    notePage(pathname);
  }, [pathname, search]);
  return null;
};

export default AgentTracker;