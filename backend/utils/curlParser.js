/**
 * Parse a cURL command and extract method, URL, headers, and body
 */
function parseCurl(curlCommand) {
  const result = {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
  };

  // Remove 'curl' prefix, --location flag, and extra whitespace
  let cmd = curlCommand
    .trim()
    .replace(/^curl\s+/i, '')
    .replace(/--location\s+/i, '');

  // Extract method
  const methodMatch = cmd.match(/-X\s+([A-Z]+)/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract headers - handle both -H and --header
  const headerRegex = /(?:-H|--header)\s+["']([^"']+)["']/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cmd)) !== null) {
    const [key, value] = headerMatch[1].split(/:\s*/);
    if (key && value) {
      result.headers[key.trim()] = value.trim();
    }
  }

  // Extract body data - handle various formats including multiline JSON
  let bodyMatch = null;

  // Try to match --data or -d followed by quoted content (including multiline)
  // Look for opening quote, then capture everything until closing quote
  const dataRegex = /(?:--data|--data-raw|--data-binary|-d)\s+(['"])(.+?)\1/s;
  bodyMatch = cmd.match(dataRegex);

  if (bodyMatch) {
    // Clean up the body - remove line continuations and extra whitespace
    result.body = bodyMatch[2]
      .replace(/\\\s*\n\s*/g, '') // Remove line continuations
      .trim();

    // If method wasn't explicitly set and we have data, default to POST
    if (!methodMatch) {
      result.method = 'POST';
    }
  }

  // Extract URL - find first quoted string that contains http/https
  const urlMatch = cmd.match(/["']((https?:)?\/\/[^"']+)["']/);
  if (urlMatch) {
    result.url = urlMatch[1];
  }

  return result;
}

module.exports = { parseCurl };
