import { createContext, useContext } from "react";

export const ReservationsContext = createContext(null);
export const useReservations = () => useContext(ReservationsContext);

export const isTaken = (list, zone, date, slot) =>
  list.some((r) => r.zone === zone && r.date === date && r.slot === slot);
