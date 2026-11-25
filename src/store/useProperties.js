import { useMemo } from "react";
import { properties } from "../data";
import { useStore } from "./StoreContext";

export function useProperties() {
  const { state } = useStore();
  return useMemo(() => [...properties, ...state.listings], [state.listings]);
}
