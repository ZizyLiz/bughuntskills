const SHARED_COOKIE_DOMAIN = "shijicloud.com";
const AUTH_COOKIE_PATH = "/";
const AUTH_COOKIE_SECURE = true;
const AUTH_COOKIE_SAME_SITE = "Lax";
const TRUSTED_RETURN_URL_DOMAINS = [SHARED_COOKIE_DOMAIN];
const LOCALHOST_RETURN_URL_HOST = "localhost";
const TOKEN_QUERY_PARAM_NAMES = ["access_token", "refresh_token", "id_token"];
const ABSOLUTE_URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

function normalizeHost(hostname) {
  return String(hostname || "").toLowerCase().replace(/\.$/, "");
}

function isTrustedReturnUrlHost(hostname) {
  const host = normalizeHost(hostname);
  return TRUSTED_RETURN_URL_DOMAINS.some(function (domain) {
    const normalizedDomain = normalizeHost(domain);
    return host === normalizedDomain || host.endsWith("." + normalizedDomain);
  });
}

function isLocalhostReturnUrlHost(hostname) {
  return normalizeHost(hostname) === LOCALHOST_RETURN_URL_HOST;
}

function isLocalhostReturnUrl(returnUrl) {
  try {
    const url = new URL(returnUrl);
    return (
      isLocalhostReturnUrlHost(url.hostname) &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch (error) {
    return false;
  }
}

function hasTokenParamName(name) {
  const normalizedName = String(name || "").toLowerCase();
  return TOKEN_QUERY_PARAM_NAMES.indexOf(normalizedName) !== -1;
}

function removeTokenSearchParams(searchParams) {
  Array.from(searchParams.keys()).forEach(function (key) {
    if (hasTokenParamName(key)) {
      searchParams.delete(key);
    }
  });
}

function stripTokenParamsFromHash(hash) {
  if (!hash || hash === "#") {
    return hash || "";
  }

  const hashValue = hash.charAt(0) === "#" ? hash.slice(1) : hash;
  const queryIndex = hashValue.indexOf("?");
  const looksLikeQuery = queryIndex === -1 && hashValue.indexOf("=") !== -1;

  if (queryIndex === -1 && !looksLikeQuery) {
    return hash;
  }

  const prefix = queryIndex === -1 ? "" : hashValue.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? hashValue : hashValue.slice(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  removeTokenSearchParams(params);

  const cleanQuery = params.toString();
  if (prefix) {
    return cleanQuery ? "#" + prefix + "?" + cleanQuery : "#" + prefix;
  }

  return cleanQuery ? "#" + cleanQuery : "";
}

function serializeUrl(url, isRelative) {
  url.hash = stripTokenParamsFromHash(url.hash);
  if (isRelative) {
    return url.pathname + url.search + url.hash;
  }
  return url.toString();
}

function normalizeReturnUrl(returnUrl) {
  if (typeof returnUrl !== "string") {
    return null;
  }

  const value = returnUrl.trim();
  if (!value) {
    return null;
  }

  return value.replace(/([^:]\/)\/+/g, "$1");
}

function sanitizeReturnUrl(returnUrl) {
  const normalizedReturnUrl = normalizeReturnUrl(returnUrl);
  if (!normalizedReturnUrl || normalizedReturnUrl.indexOf("//") === 0) {
    return null;
  }

  if (normalizedReturnUrl.charAt(0) === "/") {
    const relativeUrl = new URL(normalizedReturnUrl, "https://identity.local");
    removeTokenSearchParams(relativeUrl.searchParams);
    return serializeUrl(relativeUrl, true);
  }

  if (!ABSOLUTE_URL_SCHEME_RE.test(normalizedReturnUrl)) {
    return null;
  }

  try {
    const url = new URL(normalizedReturnUrl);
    if (
      url.username ||
      url.password ||
      (
        (url.protocol !== "https:" || !isTrustedReturnUrlHost(url.hostname)) &&
        !isLocalhostReturnUrl(normalizedReturnUrl)
      )
    ) {
      return null;
    }

    removeTokenSearchParams(url.searchParams);
    return serializeUrl(url, false);
  } catch (error) {
    return null;
  }
}

function buildLocalhostReturnUrlWithToken(returnUrl, tokenValue) {
  const sanitizedReturnUrl = sanitizeReturnUrl(returnUrl);
  if (!sanitizedReturnUrl || !isLocalhostReturnUrl(sanitizedReturnUrl)) {
    return null;
  }

  const url = new URL(sanitizedReturnUrl);
  if (tokenValue && tokenValue.access_token) {
    url.searchParams.set("access_token", tokenValue.access_token);
  }
  return serializeUrl(url, false);
}

function buildReturnUrlWithParams(returnUrl, params) {
  const sanitizedReturnUrl = sanitizeReturnUrl(returnUrl);
  if (!sanitizedReturnUrl) {
    return null;
  }

  const isRelative = sanitizedReturnUrl.charAt(0) === "/";
  const url = new URL(sanitizedReturnUrl, "https://identity.local");
  Object.keys(params || {}).forEach(function (key) {
    const value = params[key];
    if (value === undefined || value === null || hasTokenParamName(key)) {
      return;
    }
    url.searchParams.set(key, value);
  });

  removeTokenSearchParams(url.searchParams);
  return serializeUrl(url, isRelative);
}

function setSharedAuthCookie(cookies, cookieName, tokenValue) {
  if (!cookies || typeof cookies.set !== "function" || !cookieName) {
    return false;
  }

  cookies.set(
    cookieName,
    tokenValue,
    0,
    AUTH_COOKIE_PATH,
    SHARED_COOKIE_DOMAIN,
    AUTH_COOKIE_SECURE,
    AUTH_COOKIE_SAME_SITE
  );
  return true;
}

function removeSharedAuthCookie(cookies, cookieName) {
  if (!cookies || typeof cookies.remove !== "function" || !cookieName) {
    return false;
  }

  cookies.remove(cookieName, AUTH_COOKIE_PATH, SHARED_COOKIE_DOMAIN);
  cookies.remove(cookieName);
  return true;
}

function redirectToReturnUrlWithCookie(options) {
  const redirectUrl = buildReturnUrlWithParams(options.returnUrl, options.extraParams);
  if (!redirectUrl) {
    return false;
  }

  if (isLocalhostReturnUrl(redirectUrl)) {
    options.location.href = buildLocalhostReturnUrlWithToken(redirectUrl, options.tokenValue);
    return true;
  }

  setSharedAuthCookie(options.cookies, options.cookieName, options.tokenValue, options.nowSeconds);
  options.location.href = redirectUrl;
  return true;
}

module.exports = {
  SHARED_COOKIE_DOMAIN,
  buildLocalhostReturnUrlWithToken,
  buildReturnUrlWithParams,
  isTrustedReturnUrlHost,
  redirectToReturnUrlWithCookie,
  removeSharedAuthCookie,
  sanitizeReturnUrl,
  setSharedAuthCookie,
};
