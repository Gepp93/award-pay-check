"""Build engine-v2 snapshots from raw Fair Work Commission API pages.

Raw pages were downloaded on 2026-10-29 from api.fwc.gov.au (pay-rates,
penalties, wage-allowances) through a temporary development-only function,
and public holidays from data.gov.au ("Australian Public Holidays Dates
Machine Readable Dataset", 2024 and 2025 resources).

Only fields needed by the engine are kept. Values are copied verbatim: no
rate, percentage or amount is computed or edited here.
Usage: python3 scripts/engine-v2/build_snapshots.py /tmp/fwc [AWARD ...]
Default award list is the original three; pass awards explicitly to build
others (e.g. MA000020 MA000025). Awards listed in inline_penalties.json get
their hand-verified award-text penalty records merged in (the Fair Work pay
database has no penalty records for them).
"""
import csv, glob, json, sys
from pathlib import Path

RAW = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/fwc")
AWARDS = sys.argv[2:] or ["MA000004", "MA000009", "MA000003"]
OUT = Path(__file__).resolve().parents[2] / "supabase/functions/_shared/engine-v2/data"
OUT.mkdir(parents=True, exist_ok=True)
YEARS = {2023, 2024, 2025, 2026}
FETCHED = "2026-10-30"
INLINE = json.load(open(Path(__file__).parent / "inline_penalties.json"))

def rows(pattern):
    out = []
    for f in sorted(glob.glob(str(RAW / pattern))):
        out += json.load(open(f)).get("results", [])
    return out

def uniq(items, key):
    seen, out = set(), []
    for i in items:
        k = key(i)
        if k not in seen:
            seen.add(k); out.append(i)
    return out

for award in AWARDS:
    rates = [
        {
            "classificationFixedId": r["classification_fixed_id"],
            "classification": r["classification"],
            "parent": r["parent_classification_name"],
            "employeeRateType": r["employee_rate_type_code"],
            "calculatedRate": r["calculated_rate"],
            "calculatedRateType": r["calculated_rate_type"],
            "operativeFrom": r["operative_from"],
            "operativeTo": r["operative_to"],
            "publishedYear": r["published_year"],
        }
        for r in rows(f"all/{award}-pay-rates-*.json") if r["published_year"] in YEARS
    ]
    penalties = [
        {
            "penaltyFixedId": p["penalty_fixed_id"],
            "clauseFixedId": p["clause_fixed_id"],
            "clauseDescription": p["clause_description"],
            "penaltyDescription": p["penalty_description"],
            "classificationLevel": p["classification_level"],
            "employeeRateType": p["employee_rate_type_code"],
            "rate": p["rate"],
            "operativeFrom": p["operative_from"],
            "operativeTo": p["operative_to"],
            "publishedYear": p["published_year"],
        }
        for p in uniq(rows(f"pen/{award}-*.json"), lambda p: (p["penalty_fixed_id"], p["operative_from"]))
        if p["published_year"] in YEARS
    ]
    wage = [
        {
            "wageAllowanceFixedId": w["wage_allowance_fixed_id"],
            "allowance": w["allowance"],
            "clauses": w["clauses"],
            "amount": w["allowance_amount"],
            "rate": w["rate"],
            "paymentFrequency": w["payment_frequency"],
            "operativeFrom": w["operative_from"],
            "operativeTo": w["operative_to"],
            "publishedYear": w["published_year"],
        }
        for w in rows(f"all/{award}-wage-allowances-*.json") if w["published_year"] in YEARS
    ]
    doc = {
        "awardCode": award, "fetched": FETCHED,
        "source": "Fair Work Commission Modern Awards Pay Database API (api.fwc.gov.au/api/v1)",
        "payRates": rates, "penalties": penalties, "wageAllowances": wage,
    }
    if award in INLINE:
        doc["inlinePenalties"] = INLINE[award]["inlinePenalties"]
        doc["inlinePenaltiesNote"] = INLINE[award]["note"]
    json.dump(doc, open(OUT / f"{award}.json", "w"), indent=1)
    print(award, len(rates), "rates", len(penalties), "penalties", len(wage), "wage allowances", len(doc.get("inlinePenalties", [])), "inline penalties")

holidays = []
for year in (2024, 2025):
    for r in csv.DictReader(open(RAW / f"ph{year}.csv", encoding="utf-8-sig")):
        holidays.append({
            "date": f"{r['Date'][:4]}-{r['Date'][4:6]}-{r['Date'][6:]}",
            "name": r["Holiday Name"], "jurisdiction": r["Jurisdiction"].upper(),
            "info": r["Information"], "source": r["More Information"],
        })
json.dump({
    "source": "data.gov.au — Australian Public Holidays Dates Machine Readable Dataset",
    "fetched": FETCHED, "coveredYears": [2024, 2025], "holidays": holidays,
}, open(OUT / "public-holidays.json", "w"), indent=1)
print(len(holidays), "holidays")
