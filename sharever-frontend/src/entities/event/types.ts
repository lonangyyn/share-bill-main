export type Event = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

export type EventDetail = Event & {
  inviteLink?: string;
};
