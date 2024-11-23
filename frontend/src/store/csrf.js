import Cookies from 'js-cookie';

// Function to handle CSRF-protected fetch requests
export async function csrfFetch(url, options = {}) {
  // Set default method to 'GET' if not provided
  options.method = options.method || 'GET';

  // Set default headers to an empty object if not provided
  options.headers = options.headers || {};

  // If method is not 'GET', add CSRF token and set Content-Type header
  if (options.method.toUpperCase() !== 'GET') {
    options.headers['Content-Type'] =
      options.headers['Content-Type'] || 'application/json';
    options.headers['XSRF-Token'] = Cookies.get('XSRF-TOKEN');
  }

  // Call the fetch function
  const res = await window.fetch(url, options);

  // Throw an error for status codes >= 400
  if (res.status >= 400) throw res;

  // Return the response for status codes < 400
  return res;
}

// Function to restore CSRF token (for development purposes)
export function restoreCSRF() {
  return csrfFetch('/api/csrf/restore');
}
