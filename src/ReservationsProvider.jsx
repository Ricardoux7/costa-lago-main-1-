import { useMemo, useReducer } from "react";
import { reservationsSeed } from "./data";
import { ReservationsContext } from "./ReservationsContext";

function reducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, action.reservation];
    case "remove":
      return state.filter((r) => r.id !== action.id);
    default:
      return state;
  }
}

export function ReservationsProvider({ children }) {
  const [reservations, dispatch] = useReducer(reducer, reservationsSeed);
  const value = useMemo(() => ({ reservations, dispatch }), [reservations]);
  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}
