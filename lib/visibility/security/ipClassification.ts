/**
 * Pure IP-range classification (SSOT §14.1: "reject IPv4/IPv6 private,
 * loopback, link-local, multicast, reserved" and "reject cloud metadata
 * hosts"). No I/O here on purpose — this is the part of the SSRF defense
 * that must be exhaustively unit-testable without a network.
 */

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) + octet;
  }
  return value >>> 0;
}

type Ipv4Range = { base: string; prefix: number };

const IPV4_BLOCKED_RANGES: Ipv4Range[] = [
  { base: "0.0.0.0", prefix: 8 }, // "this" network
  { base: "10.0.0.0", prefix: 8 }, // private
  { base: "100.64.0.0", prefix: 10 }, // carrier-grade NAT
  { base: "127.0.0.0", prefix: 8 }, // loopback
  { base: "169.254.0.0", prefix: 16 }, // link-local (covers 169.254.169.254 cloud metadata)
  { base: "172.16.0.0", prefix: 12 }, // private
  { base: "192.0.0.0", prefix: 24 }, // IETF protocol assignments
  { base: "192.0.2.0", prefix: 24 }, // TEST-NET-1
  { base: "192.168.0.0", prefix: 16 }, // private
  { base: "198.18.0.0", prefix: 15 }, // benchmark testing
  { base: "198.51.100.0", prefix: 24 }, // TEST-NET-2
  { base: "203.0.113.0", prefix: 24 }, // TEST-NET-3
  { base: "224.0.0.0", prefix: 4 }, // multicast
  { base: "240.0.0.0", prefix: 4 }, // reserved
  { base: "255.255.255.255", prefix: 32 }, // limited broadcast
];

function ipv4InRange(ip: number, range: Ipv4Range): boolean {
  const base = ipv4ToInt(range.base);
  if (base === null) return false;
  if (range.prefix === 0) return true;
  const mask = range.prefix === 32 ? 0xffffffff : (0xffffffff << (32 - range.prefix)) >>> 0;
  return (ip & mask) === (base & mask);
}

export function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return true; // unparseable — fail closed
  return IPV4_BLOCKED_RANGES.some((range) => ipv4InRange(value, range));
}

function parseIpv6Groups(ip: string): number[] | null {
  const withoutZone = ip.split("%")[0];
  if (!withoutZone.includes(":")) return null;

  const [headPart, tailPart] = withoutZone.split("::");
  if (tailPart === undefined && withoutZone.split(":").length !== 8) return null;

  function expandPart(part: string): string[] {
    return part ? part.split(":") : [];
  }

  const head = expandPart(headPart);
  const tail = tailPart !== undefined ? expandPart(tailPart) : [];

  // Support trailing embedded IPv4 (e.g. "::ffff:192.168.0.1").
  function expandEmbeddedIpv4(groups: string[]): string[] {
    const last = groups[groups.length - 1];
    if (last && last.includes(".")) {
      const ipv4 = ipv4ToInt(last);
      if (ipv4 === null) return groups;
      const high = (ipv4 >>> 16) & 0xffff;
      const low = ipv4 & 0xffff;
      return [...groups.slice(0, -1), high.toString(16), low.toString(16)];
    }
    return groups;
  }

  const expandedHead = expandEmbeddedIpv4(head);
  const expandedTail = expandEmbeddedIpv4(tail);

  const missing = 8 - (expandedHead.length + expandedTail.length);
  if (tailPart === undefined) {
    if (expandedHead.length !== 8) return null;
  } else if (missing < 0) {
    return null;
  }

  const fullGroups =
    tailPart === undefined
      ? expandedHead
      : [...expandedHead, ...Array(missing).fill("0"), ...expandedTail];

  if (fullGroups.length !== 8) return null;

  const values: number[] = [];
  for (const group of fullGroups) {
    if (!/^[0-9a-fA-F]{0,4}$/.test(group)) return null;
    values.push(group === "" ? 0 : parseInt(group, 16));
  }
  return values;
}

export function isBlockedIpv6(ip: string): boolean {
  const groups = parseIpv6Groups(ip);
  if (!groups) return true; // unparseable — fail closed

  const [g0, g1, , , , , g6, g7] = groups;

  // ::1 loopback
  if (groups.every((g, i) => (i < 7 ? g === 0 : g === 1))) return true;
  // :: unspecified
  if (groups.every((g) => g === 0)) return true;
  // fe80::/10 link-local
  if ((g0 & 0xffc0) === 0xfe80) return true;
  // fc00::/7 unique local
  if ((g0 & 0xfe00) === 0xfc00) return true;
  // ff00::/8 multicast
  if ((g0 & 0xff00) === 0xff00) return true;
  // 2001:db8::/32 documentation
  if (g0 === 0x2001 && g1 === 0x0db8) return true;
  // ::ffff:0:0/96 IPv4-mapped — validate the embedded IPv4 address instead
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    const embeddedIpv4 = `${(g6 >>> 8) & 0xff}.${g6 & 0xff}.${(g7 >>> 8) & 0xff}.${g7 & 0xff}`;
    return isBlockedIpv4(embeddedIpv4);
  }

  return false;
}

export function isPubliclyRoutableIp(ip: string, family: 4 | 6): boolean {
  if (family === 4) return !isBlockedIpv4(ip);
  return !isBlockedIpv6(ip);
}

/** Known cloud metadata / internal-service hostnames, independent of IP (SSOT §14.1). */
const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "localhost",
]);

export function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.has(lower) || lower.endsWith(".local") || lower.endsWith(".internal");
}
