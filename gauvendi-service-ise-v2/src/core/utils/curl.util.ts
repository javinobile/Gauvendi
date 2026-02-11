export const getCurlCommand = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any
) => {
  const headersString = Object.entries(headers)
    .map(([key, value]) => `--header '${key}: ${value}'`)
    .join(' \\\n');

  const contentType = headers['Content-Type'] || headers['content-type'];

  let dataString = '';
  if (body) {
    if (contentType === 'application/x-www-form-urlencoded') {
      // For form-urlencoded, convert body object to --data-urlencode parameters
      if (typeof body === 'object' && body !== null) {
        dataString = Object.entries(body)
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          .map(([key, value]) => `--data-urlencode '${key}=${value}'`)
          .join(' \\\n');
      } else {
        dataString = `--data-urlencode '${body}'`;
      }
    } else {
      // For JSON or other content types, use --data-raw
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      dataString = `--data-raw '${bodyString}'`;
    }
  }

  return `curl --request ${method.toUpperCase()} --location '${url}' \\\n${headersString}${dataString ? ' \\\n' + dataString : ''}`;
};
