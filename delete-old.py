import urllib.request
import json

BASE_URL = "http://localhost:3000"

# Get all controls
req = urllib.request.Request(
    f"{BASE_URL}/api/controls?companyId=CO-DDL",
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

controls = data["controls"]
old_controls = [c for c in controls if not c["controlId"].startswith("CO-")]

print(f"Deleting {len(old_controls)} old controls...")

for ctrl in old_controls:
    req = urllib.request.Request(
        f"{BASE_URL}/api/controls/{ctrl['id']}",
        headers={"Content-Type": "application/json"},
        method="DELETE"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  Deleted {ctrl['controlId']}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  FAILED {ctrl['controlId']}: {body[:200]}")

print("\nDone.")
