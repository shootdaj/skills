---
name: azure-static-publish
description: Publish a static site (an HTML report, a design room, a prototype folder) to Azure Static Web Apps behind company SSO, in a sandbox subscription, with names suffixed by the person running it and owner tags. Use when the user says host it on Azure, put it behind SSO, share it with the team on Azure, or redeploy the Azure copy. Idempotent, so it also updates an existing site.
---

# Azure static publish

One command publishes a folder that has `index.html` at its root:

```bash
bash <this skill>/scripts/publish.sh <dir> --project <short-name> [--access sso|invite|public]
```

It creates `rg-<project>-<suffix>` and a Static Web App `<project>-<suffix>` if they are missing, stages the folder, writes an auth config, deploys, checks that anonymous visitors are redirected, and prints `RESULT url=... rg=... app=... access=... anon_status=...`. Open the URL in Chrome afterwards.

## Defaults (override with flags or env)

| Setting | Default | Flag / env |
| --- | --- | --- |
| Subscription | `AIX-SANDBOX-SUB-1` | `--sub`, `AZ_STATIC_SUB` |
| Name suffix | the signed-in user's first name (jane.doe@company.com gives `-jane`), so every resource ends in `-<name>` | `--suffix`, `AZ_STATIC_SUFFIX` |
| Owner tag | the signed-in user (sandbox policy requires an `owner` tag on resource groups) | `--owner`, `AZ_STATIC_OWNER` |
| Region | `eastus2` | `--location` |
| Plan | `Standard` (work subscription; enables custom auth later) | `--sku` |
| Access | `sso`: any signed-in Microsoft account, which is how Aya SSO users get in | `--access` |

`--access invite` allows only invited users (prints the invite command). `--access public` needs the user to say so explicitly.

## Before you run it

1. Ask for or infer the project name (short, lowercase, hyphens). Never rename later: Azure cannot rename resources, so a new name means delete and recreate.
2. Make sure the folder has no secrets and no local-only files; the script already drops `.py`, `.mjs`, logs, `.git`, `node_modules`. Add `--exclude <glob>` for anything else (for example vote data: `--exclude '_vote/*.json'`).
3. If the folder already has a `staticwebapp.config.json`, the script keeps it.

## Known issues and fixes

| Symptom | Fix |
| --- | --- |
| `LOGIN_NEEDED` or `AADSTS50078` (MFA expired) | Ask the user to run `! az login --tenant <tenant>` in the prompt, then rerun |
| `Current directory cannot be identical to or contained within artifact folders` | The script deploys from a staging parent folder; do not deploy with the site folder as the working directory |
| `Insufficient privileges` creating an app registration | Sandbox users cannot create Entra apps. Stay on `sso` (any Microsoft account). For Aya-tenant-only sign-in, someone with Entra rights registers an app; then add an `auth.identityProviders.azureActiveDirectory` block with the tenant issuer and set `AAD_CLIENT_ID` / `AAD_CLIENT_SECRET` app settings |
| Signed-in user sees 403 with `invite` access | They have not accepted an invite, or the invite email does not match their sign-in |
| Local-only features (local servers on 127.0.0.1) | They do not work on the hosted copy; say so in the reply |

## Report back

The URL, the access mode, the resource group and app names, and anything that only works locally. Record the URL, names and access mode in project memory so later redeploys reuse them.
