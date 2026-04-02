export const endpoints = {
  auth: {
    login: () => "/auth/login",
    registerRequest: () => "/auth/register/request",
    registerResend: () => "/auth/register/resend",
    registerConfirm: () => "/auth/register/confirm",
    refresh: () => "/auth/refresh",
    logout: () => "/auth/logout",
  },

  users: {
    me: () => "/v1/users/profile",
    updateProfile: () => "/v1/users/profile",
    avatar: () => "/v1/users/avatar",
    password: () => "/v1/users/password",
    //
    changePassword: () => "/users/password",
  },

  participants: {
    list: (eventId: string) => `/v1/events/${eventId}/participants`,
    add: (eventId: string) => `/v1/events/${eventId}/participants`,
    update: (participantId: string) => `/v1/participants/${participantId}`,
    joinByLink: (eventId: string) => `/v1/events/${eventId}/join`,
  },

  events: {
    list: () => "/v1/events",
    detail: (eventId: string) => `/v1/events/${eventId}`,
    create: () => "/v1/events",
    update: (eventId: string) => `/v1/events/${eventId}`,
    remove: (eventId: string) => `/v1/events/${eventId}`,
  },

  transactions: {
    list: (eventId: string) => `/v1/events/${eventId}/transactions`,
    create: (eventId: string) => `/v1/events/${eventId}/transactions`,
    detail: (txnId: string) => `/v1/transactions/${txnId}`,
    update: (txnId: string) => `/v1/transactions/${txnId}`,
    remove: (_eventId: string, txnId: string) => `/v1/transactions/${txnId}`,
  },

  settlement: {
    summary: (eventId: string) => `/v1/events/${eventId}/summary`,
    generateQr: (eventId: string) => `/v1/events/${eventId}/generate-qrcode`,
    settleUp: (eventId: string) => `/v1/events/${eventId}/settlements`,
  },

  paymentRequests: {
    list: (eventId: string) => `/v1/events/${eventId}/payment-requests`,
    create: (eventId: string) => `/v1/events/${eventId}/payment-requests`,
    confirm: (eventId: string, requestId: string) =>
      `/v1/events/${eventId}/payment-requests/${requestId}/confirm`,
    cancel: (eventId: string, requestId: string) =>
      `/v1/events/${eventId}/payment-requests/${requestId}/cancel`,
  },
};
