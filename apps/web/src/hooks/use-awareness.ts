"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { AwarenessCursor, AwarenessUser } from "@/lib/types";

export type AwarenessState = {
  user?: AwarenessUser;
  cursor?: AwarenessCursor;
};

export function useAwareness(awareness: Awareness | null, user: AwarenessUser | null) {
  const [states, setStates] = useState<Map<number, AwarenessState>>(new Map());

  useEffect(() => {
    if (!awareness || !user) {
      return;
    }

    awareness.setLocalStateField("user", user);
  }, [awareness, user]);

  useEffect(() => {
    if (!awareness) {
      return;
    }

    const syncStates = () => {
      setStates(new Map(awareness.getStates() as Map<number, AwarenessState>));
    };

    syncStates();
    awareness.on("change", syncStates);

    return () => {
      awareness.off("change", syncStates);
    };
  }, [awareness]);

  const collaborators = useMemo(
    () =>
      Array.from(states.entries())
        .filter(([clientId]) => clientId !== awareness?.clientID)
        .map(([, state]) => state),
    [awareness?.clientID, states],
  );

  const setCursor = useCallback(
    (cursor: AwarenessCursor | null) => {
      awareness?.setLocalStateField("cursor", cursor);
    },
    [awareness],
  );

  return {
    collaborators,
    setCursor,
  };
}
