#!/usr/bin/env bash
# Publish a static folder to Azure Static Web Apps behind SSO. Idempotent: creates what is missing, redeploys what exists.
# usage: publish.sh <dir> --project <name> [--access sso|invite|public] [--sub <subscription>] [--suffix <owner>]
#                   [--location eastus2] [--sku Standard|Free] [--owner <email>] [--exclude <glob>]...
set -euo pipefail
DIR=""; PROJECT=""; ACCESS="sso"; SUB="${AZ_STATIC_SUB:-AIX-SANDBOX-SUB-1}"; SUFFIX="${AZ_STATIC_SUFFIX:-anshul}"
LOC="eastus2"; SKU="Standard"; OWNER="${AZ_STATIC_OWNER:-}"; EXCL=()
while [ $# -gt 0 ]; do case "$1" in
  --project) PROJECT="$2"; shift 2;; --access) ACCESS="$2"; shift 2;; --sub) SUB="$2"; shift 2;; --suffix) SUFFIX="$2"; shift 2;;
  --location) LOC="$2"; shift 2;; --sku) SKU="$2"; shift 2;; --owner) OWNER="$2"; shift 2;; --exclude) EXCL+=("--exclude" "$2"); shift 2;;
  -h|--help) sed -n '2,5p' "$0"; exit 0;; *) DIR="$1"; shift;; esac; done
[ -n "$DIR" ] && [ -f "$DIR/index.html" ] || { echo "ERROR: <dir> with index.html required" >&2; exit 2; }
[ -n "$PROJECT" ] || { echo "ERROR: --project required" >&2; exit 2; }
command -v az >/dev/null || { echo "ERROR: Azure CLI (az) not installed" >&2; exit 2; }
if ! az account show -o none 2>/dev/null; then echo "LOGIN_NEEDED: run  az login" >&2; exit 3; fi
az account set --subscription "$SUB"
[ -n "$OWNER" ] || OWNER=$(az account show --query user.name -o tsv)
if ! az group list --query "[0].name" -o tsv >/dev/null 2>&1; then echo "LOGIN_NEEDED: MFA expired, run  az login --tenant $(az account show --query tenantId -o tsv)" >&2; exit 3; fi
RG="rg-${PROJECT}-${SUFFIX}"; APP="${PROJECT}-${SUFFIX}"
az group create -n "$RG" -l "$LOC" --tags owner="$OWNER" purpose="$PROJECT" -o none
if ! az staticwebapp show -n "$APP" -g "$RG" -o none 2>/dev/null; then
  az staticwebapp create -n "$APP" -g "$RG" -l "$LOC" --sku "$SKU" --tags owner="$OWNER" purpose="$PROJECT" -o none
fi
HOST=$(az staticwebapp show -n "$APP" -g "$RG" --query defaultHostname -o tsv)
# stage outside the source so the deploy client never sees its own working dir inside the artifact
STAGE=$(mktemp -d)/site; mkdir -p "$STAGE"
rsync -a --delete --exclude '.git' --exclude '.DS_Store' --exclude 'node_modules' --exclude '__pycache__' --exclude '*.py' --exclude '*.mjs' --exclude '*.log' "${EXCL[@]}" "$DIR"/ "$STAGE"/
case "$ACCESS" in
  sso)    ROLE='["authenticated"]';; invite) ROLE='["member"]';; public) ROLE='["anonymous"]';;
  *) echo "ERROR: --access must be sso, invite or public" >&2; exit 2;; esac
if [ ! -f "$STAGE/staticwebapp.config.json" ]; then cat > "$STAGE/staticwebapp.config.json" <<JSON
{
  "routes": [
    { "route": "/.auth/login/github", "statusCode": 404 },
    { "route": "/.auth/login/twitter", "statusCode": 404 },
    { "route": "/.auth/*", "allowedRoles": ["anonymous"] },
    { "route": "/*", "allowedRoles": $ROLE }
  ],
  "responseOverrides": { "401": { "redirect": "/.auth/login/aad?post_login_redirect_uri=.referrer", "statusCode": 302 } },
  "globalHeaders": { "X-Robots-Tag": "noindex, nofollow" }
}
JSON
fi
TOKEN=$(az staticwebapp secrets list -n "$APP" -g "$RG" --query properties.apiKey -o tsv)
( cd "$(dirname "$STAGE")" && npx -y @azure/static-web-apps-cli@2 deploy ./site --deployment-token "$TOKEN" --env production 2>&1 | grep -E "deployed|✖|rror" | head -5 )
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$HOST/")
echo "RESULT url=https://$HOST rg=$RG app=$APP access=$ACCESS anon_status=$CODE"
if [ "$ACCESS" = "invite" ]; then
  echo "INVITE: az staticwebapp users invite -n $APP -g $RG --authentication-provider aad --user-details <email> --roles member --domain $HOST --invitation-expiration-in-hours 168 --query invitationUrl -o tsv"
fi
