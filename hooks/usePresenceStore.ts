"use client";

import { create } from "zustand";
import type { PresenceUser } from "@/lib/types";

interface PresenceState {
  otherUsers: PresenceUser[];
  setOtherUsers: (users: PresenceUser[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  otherUsers: [],
  setOtherUsers: (users) => set({ otherUsers: users }),
}));
