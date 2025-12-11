// src/features/protectedAreas/hooks/useProtectedAreas.ts

import { useEffect, useState } from "react";
import {
  fetchProtectedAreas,
  type IpaFeatureCollection,
} from "../../../api/protectedAreas";

export type UseProtectedAreasResult = {
  data: IpaFeatureCollection | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export function useProtectedAreas(): UseProtectedAreasResult {
  const [data, setData] = useState<IpaFeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        const result = await fetchProtectedAreas();
        setData(result);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { data, isLoading, isError, error };
}
