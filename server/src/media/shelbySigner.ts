import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

interface ShelbyCliConfig {
  accounts: Record<string, { private_key: string; address: string }>;
}

/** Loads the platform/dev signing account from the Shelby CLI's own config
 * (~/.shelby/config.yaml, written by `shelby init`) rather than duplicating
 * a raw private key into a project .env file. */
export async function loadCliAccount(accountName: string): Promise<Account> {
  const configPath = path.join(homedir(), ".shelby", "config.yaml");
  const raw = await readFile(configPath, "utf-8");
  const config = parse(raw) as ShelbyCliConfig;

  const entry = config.accounts?.[accountName];
  if (!entry) {
    throw new Error(
      `No account named "${accountName}" in ~/.shelby/config.yaml. Run \`shelby account create --name ${accountName}\` or update SHELBY_CLI_ACCOUNT_NAME in server/.env.`,
    );
  }

  const hexKey = entry.private_key.replace(/^ed25519-priv-/, "");
  return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(hexKey) });
}
