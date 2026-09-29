// tsx uses process.geteuid() when available and falls back to os.userInfo()
// when naming its temporary directory. Some managed Windows environments make
// os.userInfo() fail before tests start. Windows temp directories are already
// user-scoped, so a stable numeric stand-in preserves the intended isolation.
if (process.platform === "win32" && typeof process.geteuid !== "function") {
  Object.defineProperty(process, "geteuid", {
    configurable: true,
    value: () => 1,
  });
}
