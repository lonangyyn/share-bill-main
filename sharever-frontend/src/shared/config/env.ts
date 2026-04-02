export const env = {
  API_URL: import.meta.env.VITE_API_URL,
};


if (!env.API_URL) {
  // eslint-disable-next-line no-console
  console.warn("Missing VITE_API_URL in .env.local");
}
