function operator(proxies) {
  const { fingerprint = "chrome", protocols = "vmess,vless,trojan,anytls" } = $arguments;
  const supported = new Set(
    String(protocols)
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  return proxies.map((proxy) => {
    if (!supported.has(String(proxy.type || "").toLowerCase()) || proxy["client-fingerprint"]) return proxy;
    return { ...proxy, "client-fingerprint": String(fingerprint) };
  });
}
