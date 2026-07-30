import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isBlockedIpv4,
  isBlockedIpv6,
  isPubliclyRoutableIp,
  isBlockedHostname,
} from "@/lib/visibility/security/ipClassification";

test("isBlockedIpv4 blocks loopback, private and link-local ranges", () => {
  assert.equal(isBlockedIpv4("127.0.0.1"), true);
  assert.equal(isBlockedIpv4("10.0.0.1"), true);
  assert.equal(isBlockedIpv4("172.16.5.5"), true);
  assert.equal(isBlockedIpv4("172.31.255.255"), true);
  assert.equal(isBlockedIpv4("192.168.1.1"), true);
  assert.equal(isBlockedIpv4("169.254.169.254"), true, "cloud metadata address must be blocked");
  assert.equal(isBlockedIpv4("100.64.0.1"), true, "carrier-grade NAT range");
});

test("isBlockedIpv4 blocks multicast, reserved and broadcast", () => {
  assert.equal(isBlockedIpv4("224.0.0.1"), true);
  assert.equal(isBlockedIpv4("240.0.0.1"), true);
  assert.equal(isBlockedIpv4("255.255.255.255"), true);
  assert.equal(isBlockedIpv4("0.0.0.0"), true);
});

test("isBlockedIpv4 allows ordinary public addresses", () => {
  assert.equal(isBlockedIpv4("8.8.8.8"), false);
  assert.equal(isBlockedIpv4("1.1.1.1"), false);
  assert.equal(isBlockedIpv4("93.184.216.34"), false);
});

test("isBlockedIpv4 fails closed on malformed input", () => {
  assert.equal(isBlockedIpv4("999.1.1.1"), true);
  assert.equal(isBlockedIpv4("not-an-ip"), true);
  assert.equal(isBlockedIpv4("1.2.3"), true);
});

test("isBlockedIpv6 blocks loopback, unspecified, link-local and unique-local", () => {
  assert.equal(isBlockedIpv6("::1"), true);
  assert.equal(isBlockedIpv6("::"), true);
  assert.equal(isBlockedIpv6("fe80::1"), true);
  assert.equal(isBlockedIpv6("fc00::1"), true);
  assert.equal(isBlockedIpv6("fd12:3456:789a:1::1"), true);
});

test("isBlockedIpv6 blocks multicast and documentation ranges", () => {
  assert.equal(isBlockedIpv6("ff02::1"), true);
  assert.equal(isBlockedIpv6("2001:db8::1"), true);
});

test("isBlockedIpv6 allows an ordinary public address", () => {
  assert.equal(isBlockedIpv6("2001:4860:4860::8888"), false);
});

test("isBlockedIpv6 validates the embedded IPv4 address in ::ffff:/96 mapped addresses", () => {
  assert.equal(isBlockedIpv6("::ffff:127.0.0.1"), true);
  assert.equal(isBlockedIpv6("::ffff:192.168.1.1"), true);
  assert.equal(isBlockedIpv6("::ffff:8.8.8.8"), false);
});

test("isBlockedIpv6 fails closed on malformed input", () => {
  assert.equal(isBlockedIpv6("not-an-ipv6-address"), true);
});

test("isPubliclyRoutableIp dispatches by family", () => {
  assert.equal(isPubliclyRoutableIp("8.8.8.8", 4), true);
  assert.equal(isPubliclyRoutableIp("127.0.0.1", 4), false);
  assert.equal(isPubliclyRoutableIp("2001:4860:4860::8888", 6), true);
  assert.equal(isPubliclyRoutableIp("::1", 6), false);
});

test("isBlockedHostname blocks known metadata/internal hosts", () => {
  assert.equal(isBlockedHostname("metadata.google.internal"), true);
  assert.equal(isBlockedHostname("METADATA.GOOGLE.INTERNAL"), true);
  assert.equal(isBlockedHostname("localhost"), true);
  assert.equal(isBlockedHostname("printer.local"), true);
  assert.equal(isBlockedHostname("service.internal"), true);
  assert.equal(isBlockedHostname("example.com"), false);
});
