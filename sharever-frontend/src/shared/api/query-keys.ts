export const queryKeys = {
  me: ["me"] as const,

  events: {
    all: ["events"] as const,
    list: () => ["events", "list"] as const,
    detail: (eventId: string) => ["events", "detail", eventId] as const,
  },

  participants: {
    list: (eventId: string) => ["participants", eventId] as const,
  },

  transactions: {
    list: (eventId: string) => ["transactions", eventId] as const,
  },

  settlement: {
    summary: (eventId: string) => ["settlement", "summary", eventId] as const,
  },

  activity: {
    list: (eventId?: string) => ["activity", eventId ?? "global"] as const,
  },
};
