import { webapiTest } from "../src/lib/mt5-webapi";

const login = process.argv[2] || "1164";
const password = process.argv[3] || "Abcd@1234";

const endpoints = ["185.67.127.231:443", "185.67.127.231:1951"];

(async () => {
  for (const server of endpoints) {
    const r = await webapiTest({ server, login, password, cryptMethod: "NONE" });
    console.log(`${server} ->`, JSON.stringify(r));
  }
  process.exit(0);
})();
