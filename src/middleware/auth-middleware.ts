// This is a client-side middleware to add auth headers to API requests
export function addAuthHeadersToRequest(req: Request): Request {
  const userId = localStorage.getItem("Medical_User_Id");

  // Clone the request and add the auth header
  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${userId}`);

  const newRequest = new Request(req.url, {
    method: req.method,
    headers,
    body: req.body,
    cache: req.cache,
    credentials: req.credentials,
    integrity: req.integrity,
    keepalive: req.keepalive,
    mode: req.mode,
    redirect: req.redirect,
    referrer: req.referrer,
    referrerPolicy: req.referrerPolicy,
    signal: req.signal,
  });

  return newRequest;
}
