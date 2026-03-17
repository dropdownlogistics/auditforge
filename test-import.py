import json, urllib.request

BASE_URL = "http://localhost:3000"
COMPANY_ID = "CO-DDL"

# Just try the first 3 controls to isolate the error
controls = [
  {
    "controlId": "CO-ITGC-001",
    "processArea": "IT General Controls",
    "processName": "Access Management",
    "description": "Access to GitHub repositories is restricted to the operator and approved council seats via GitHub Teams with least-privilege principles. MFA is enforced for all accounts.",
    "controlObjective": "Ensure only authorized personnel have access to DDL GitHub repositories.",
    "controlType": "PREVENTIVE",
    "controlNature": "AUTOMATED",
    "controlFrequency": "MONTHLY",
    "keyControl": True,
  },
]

payload = {"companyId": COMPANY_ID, "controls": controls, "mode": "execute"}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    f"{BASE_URL}/api/import",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print("SUCCESS:", result)
except urllib.error.HTTPError as e:
    print("ERROR:", e.code)
    print(e.read().decode())
