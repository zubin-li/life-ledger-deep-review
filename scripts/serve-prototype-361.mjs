import { startStaticServer } from "./evidence/server.mjs";

const publicDir = new URL("../public/", import.meta.url).pathname;
const { port, url, server } = await startStaticServer(publicDir);
const entry = `${url}/prototype-361.html`;
console.log("Life Ledger 3.6.1 design study (prototype only, no persistence)");
console.log(`  ${entry}?variant=a`);
console.log(`  ${entry}?variant=b`);
console.log(`  ${entry}?variant=c`);
console.log("Press Ctrl+C to stop.");
process.on("SIGINT", () => server.close(() => process.exit(0)));
