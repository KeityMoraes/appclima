import { readFile, writeFile } from 'node:fs/promises';

const context = await readFile(new URL('../netlify/functions/AGENT_CONTEXT.md', import.meta.url), 'utf8');
const moduleSource = `export const agentContext = ${JSON.stringify(context)};\n`;
await writeFile(new URL('../netlify/functions/agent-context.mjs', import.meta.url), moduleSource);
