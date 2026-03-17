import json, urllib.request

ctrl = {"controlId":"CO-VND-006","processArea":"Vendor and Third-Party Management","processName":"Vendor Risk Reassessment","description":"On a scheduled basis, the operator revisits vendor risk assessments for key providers to consider changes in DDL reliance, new features in use, or updates to vendor security programs. Any material change in risk results in updated controls, configuration changes, or a documented risk acceptance decision.","controlObjective":"Re-evaluate the risk profile of critical vendors over time to account for changes in usage or vendor posture.","controlType":"DETECTIVE","controlNature":"MANUAL","controlFrequency":"ANNUAL","keyControl":False}

payload = {"companyId": "CO-DDL", "controls": [ctrl], "mode": "execute"}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    "http://localhost:3000/api/import",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print("SUCCESS:", json.loads(resp.read()))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print("ERROR BODY:", body)
