import urllib.request, json

BASE_URL = "http://localhost:3000"

# Get all controls
req = urllib.request.Request(
    f"{BASE_URL}/api/controls?companyId=CO-DDL",
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

controls = data["controls"]
old_ids = [c["id"] for c in controls if not c["controlId"].startswith("CO-")]
print(f"Found {len(old_ids)} old controls to delete:")
for c in controls:
    if not c["controlId"].startswith("CO-"):
        print(f"  {c['controlId']}")

print(f"\nFound {len(controls) - len(old_ids)} new controls to keep.")
