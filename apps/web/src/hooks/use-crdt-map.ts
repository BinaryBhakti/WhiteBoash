"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

export function useCRDTMap<TValue>(doc: Y.Doc | null, name: string) {
  const map = useMemo(() => (doc ? doc.getMap<TValue>(name) : null), [doc, name]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleChange = () => setVersion((current) => current + 1);
    map.observe(handleChange);

    return () => {
      map.unobserve(handleChange);
    };
  }, [map]);

  const values = useMemo(() => {
    void version;

    if (!map) {
      return [];
    }

    return Array.from(map.values());
  }, [map, version]);

  return {
    map,
    values,
    version,
    set: (key: string, value: TValue) => map?.set(key, value),
    delete: (key: string) => map?.delete(key),
  };
}
