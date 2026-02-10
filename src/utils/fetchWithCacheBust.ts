type FetchWithCacheBustOptions = {
  fetchInit?: RequestInit;
  isDev?: boolean;
  devCacheBust?: boolean;
  retryOnFailInProd?: boolean;
};

type FetchWithCacheBustResult = {
  response: Response;
  primaryUrl: string;
  finalUrl: string;
  didRetry: boolean;
};

const withCacheBust = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

export const fetchWithCacheBust = async (
  url: string,
  options: FetchWithCacheBustOptions = {}
): Promise<FetchWithCacheBustResult> => {
  const isDev = options.isDev ?? import.meta.env.DEV;
  const devCacheBust = options.devCacheBust ?? true;
  const retryOnFailInProd = options.retryOnFailInProd ?? true;

  const primaryUrl = isDev && devCacheBust ? withCacheBust(url) : url;
  let response = await fetch(primaryUrl, options.fetchInit);
  let finalUrl = primaryUrl;
  let didRetry = false;

  if (!response.ok && !isDev && retryOnFailInProd) {
    finalUrl = withCacheBust(url);
    response = await fetch(finalUrl, options.fetchInit);
    didRetry = true;
  }

  return { response, primaryUrl, finalUrl, didRetry };
};
