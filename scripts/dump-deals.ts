import { webapiDealsRaw } from "../src/lib/mt5-webapi";

const login = process.argv[2] || "129060";
(async () => {
  const r = await webapiDealsRaw({ server: "185.67.127.231:443", login: "1164", password: "Abcd@1234", cryptMethod: "NONE", clientLogin: login });
  console.log(`login ${login} -> retcode: ${r.retcode}, deals: ${r.count}`);
  const bal = r.sample.filter((d: any) => Number(d.action) === 2);
  console.log(`balance deals (action=2): ${bal.length}`);
  // count comments
  const counts: Record<string, number> = {};
  for (const d of bal) counts[d.comment] = (counts[d.comment] || 0) + 1;
  console.log("\n--- comment -> occurrences (balance deals) ---");
  for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`${n}x  ${JSON.stringify(c)}`);
  const psp = bal.filter((d: any) => /PSP-|Deposit/i.test(d.comment));
  console.log(`\n--- deals whose comment mentions PSP/Deposit: ${psp.length} ---`);
  for (const d of psp) console.log(JSON.stringify(d));
  process.exit(0);
})();
