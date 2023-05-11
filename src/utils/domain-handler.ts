import {_get} from './dash-utils';
import { parseDomain, ParseResultType } from 'parse-domain';


const splitUrl = (url:string) => {

  let urlArray = url.split(':');

  let last = urlArray[urlArray.length - 1];

  let port = parseInt(last, 10);

  let protocol = urlArray[0];

  let path = new URL(url).pathname || '';

  if (isNaN(port)) {
    // If no port is given, the default port for the service requested (e.g., "80" for an HTTP URL) is implied
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin#directives
    // https://www.geeksforgeeks.org/node-js-url-port-api/
    port = 80;
    url = `${url}:${port}${path}`;
  } else {
    // remove port
    url = url.replace(`:${port}`, '');
  }

  const urlObject = new URL(url);
  const fqdn:string = _get(urlObject, 'host') as string;

  const parseResult = parseDomain(
    // This should be a string with basic latin characters only.
    // More information below.
    fqdn
  );
  let subdomain;
  let host;
  let domain;
  // use top-level domains acknowledged by ICANN instead of  browser based top-level domain
  switch (parseResult.type) {
    case ParseResultType.Listed: {
      parseResult.icann;
      // Check if the domain is listed in the public suffix list
      const subDomains = (_get(parseResult, 'subDomains') || []) as Array<string>;

      host = subDomains[0];
      subDomains.shift();
      subdomain = subDomains.join('.');

      let ext;
      const topLevelDomains = _get(parseResult, 'topLevelDomains', []) as Array<string>;
      if (topLevelDomains.length > 0) {
        ext = topLevelDomains.join('.');
      } else {
        ext = topLevelDomains[0];
      }
      domain = `${_get(parseResult, 'domain')}.${ext}`;

      break;
    }
    case ParseResultType.Reserved:
    case ParseResultType.NotListed: {
      // Check if the domain is not listed in the public suffix list but reserved according to RFC 6761 and RFC 6762:
      domain = parseResult.hostname;
      subdomain = (_get(parseResult, 'labels', []) as Array<string>)[0];
      break;
    }
    case ParseResultType.Ip: {
      // If the given input is an IP address, parseResult.type will be ParseResultType.Ip:
      const ip = _get(parseResult, 'hostname');
      // try{
      //   const domains = await dns.lookupService(ip, port);
      //   console.log('domains', domains);
      //   domain = _get(domains,'hostname');
      //   protocol =_get(domains,'service');
      // }catch(err){
      //   domain =ip;
      //   console.log(err);
      // }
      domain = ip;
      break;
    }
    default:
      throw new Error(`${String(parseResult.hostname)} is an invalid domain`);
  }

  return { fqdn, protocol, host, subdomain, domain, port, path };
};

const splitDomain = (url:string) => {
  return splitUrl(url);
};

export class DomainHandler {
  constructor(debug?:boolean) {
    if(debug) console.log('domain handler constructed');
  }

  splitDomain(domain:string) {
    return splitDomain(domain);
  }

}
