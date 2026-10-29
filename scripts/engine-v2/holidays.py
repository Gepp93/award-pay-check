"""Engine v2 public holiday list: scope tagging, 2024-25 corrections and 2026 dates.

Run: python3 scripts/engine-v2/holidays.py
Reads the existing data.gov.au-derived list (2024-2025), tags every record with a
scope, applies corrections found during the Oct 2026 verification, and adds 2026
from each state/territory government's official calendar (read 2026-10-30).

scope values:
  statewide  - applies to every employee in the state/territory
  part_day   - applies only from fromMinute to midnight
  regional   - applies only in part of the state; location confirmation needed
  restricted - not a general public holiday (e.g. banks, public service only)
"""
import json, re
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "supabase/functions/_shared/engine-v2/data/public-holidays.json"
data = json.load(open(OUT))

SRC = {
    "NSW": "https://www.nsw.gov.au/about-nsw/public-holidays",
    "VIC": "https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2026",
    "QLD": "https://www.qld.gov.au/recreation/travel/holidays/public",
    "SA": "https://www.safework.sa.gov.au/resources/public-holidays",
    "WA": "https://www.wa.gov.au/service/employment/workplace-arrangements/public-holidays-western-australia",
    "TAS": "https://worksafe.tas.gov.au/topics/laws-and-compliance/public-holidays",
    "ACT": "https://www.act.gov.au/living-in-the-act/public-holidays-school-terms-and-daylight-saving",
    "NT": "https://nt.gov.au/nt-public-holidays",
}

def scope_of(h):
    text = f"{h['name']} {h['info']}"
    m = re.search(r"(\d{1,2})\s*pm\s*(?:to|-|–)\s*midnight", text, re.I)
    if m:
        return "part_day", (int(m.group(1)) % 12 + 12) * 60
    if re.search(r"bank holiday|public service only|state service only", text, re.I):
        return "restricted", None
    if re.search(r"\b(only|some areas|regional|region|parts? of|unless alternate)\b", text.replace("part of Easter", ""), re.I):
        return "regional", None
    return "statewide", None

holidays = []
for h in data["holidays"]:
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", h["date"] or ""):
        continue  # correction: VIC 2025 AFL Grand Final Friday had no date in the dataset; re-added below
    if h["date"] >= "2026":
        continue
    s, f = scope_of(h)
    holidays.append({**h, "scope": s, **({"fromMinute": f} if f is not None else {})})

def add(state, date, name, scope="statewide", from_minute=None, info="", source=None):
    rec = {"date": date, "name": name, "jurisdiction": state, "info": info, "source": source or SRC[state], "scope": scope}
    if from_minute is not None:
        rec["fromMinute"] = from_minute
    holidays.append(rec)

# ---- 2024-25 corrections (official sources) ----
add("VIC", "2025-09-26", "Friday before the AFL Grand Final", source="https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2025")
# TAS regional holidays absent from data.gov.au; dates from the rule on the TAS page
# (Regatta: second Monday in February; Recreation Day: first Monday in November).
for d in ("2024-02-12", "2025-02-10"):
    add("TAS", d, "Royal Hobart Regatta", "regional", info="South of and including Oatlands and Swansea (regional)")
for d in ("2024-11-04", "2025-11-03"):
    add("TAS", d, "Recreation Day", "regional", info="Parts of the state that do not observe Royal Hobart Regatta (regional)")

# ---- 2026 ----
common = [("2026-01-01", "New Year's Day"), ("2026-01-26", "Australia Day"), ("2026-04-03", "Good Friday"), ("2026-04-06", "Easter Monday"), ("2026-12-25", "Christmas Day")]
for st in SRC:
    for d, n in common:
        add(st, d, n)
for st in ("NSW", "VIC", "QLD", "SA", "ACT", "NT"):
    add(st, "2026-04-04", "Easter Saturday"); 
for st in ("NSW", "VIC", "QLD", "SA", "WA", "ACT", "NT"):
    add(st, "2026-04-05", "Easter Sunday")
for st in SRC:
    add(st, "2026-04-25", "Anzac Day")
for st in ("NSW", "WA", "ACT"):
    add(st, "2026-04-27", "Anzac Day additional day")
for st in ("NSW", "VIC", "SA", "TAS", "ACT", "NT"):
    add(st, "2026-06-08", "King's Birthday")
add("NSW", "2026-08-03", "Bank Holiday", "restricted", info="Banks and certain financial institutions only")
for st in ("NSW", "SA", "ACT"):
    add(st, "2026-10-05", "Labour Day")
for st in ("NSW", "VIC", "QLD", "SA", "WA", "ACT", "NT"):
    add(st, "2026-12-26", "Boxing Day" if st != "SA" else "Proclamation Day holiday")
for st in ("NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"):
    add(st, "2026-12-28", "Boxing Day additional day" if st != "TAS" else "Boxing Day")
add("VIC", "2026-03-09", "Labour Day")
add("VIC", "2026-09-25", "Friday before the AFL Grand Final")
add("VIC", "2026-11-03", "Melbourne Cup", "regional", info="All of Victoria unless an alternate local holiday has been arranged by a non-metro council")
add("QLD", "2026-05-04", "Labour Day")
add("QLD", "2026-08-12", "Royal Queensland Show (Brisbane area only)", "regional")
add("QLD", "2026-10-05", "King's Birthday")
add("QLD", "2026-12-24", "Christmas Eve 6pm to midnight", "part_day", 18 * 60)
add("SA", "2026-03-09", "Adelaide Cup Day")
add("SA", "2026-12-24", "Christmas Eve: 7pm to midnight", "part_day", 19 * 60)
add("SA", "2026-12-31", "New Year's Eve: 7pm to midnight", "part_day", 19 * 60)
add("WA", "2026-03-02", "Labour Day")
add("WA", "2026-06-01", "Western Australia Day")
add("WA", "2026-09-28", "King's Birthday", info="Some regional local government areas observe a different date")
add("WA", "2026-08-03", "Regional King's Birthday (Karratha, Port Hedland)", "regional")
add("TAS", "2026-03-09", "Eight Hours Day")
add("TAS", "2026-04-07", "Easter Tuesday - generally Tasmanian Public Service only", "restricted")
add("TAS", "2026-06-08", "King's Birthday") if False else None
add("TAS", "2026-02-09", "Royal Hobart Regatta", "regional")
add("TAS", "2026-11-02", "Recreation Day", "regional")
for d, n in (("2026-01-07", "Devonport Cup (half day)"), ("2026-02-25", "Launceston Cup"), ("2026-03-03", "King Island Show"), ("2026-05-08", "Agfest"), ("2026-10-02", "Burnie Show"), ("2026-10-08", "Royal Launceston Show"), ("2026-10-16", "Flinders Island Show"), ("2026-10-22", "Royal Hobart Show"), ("2026-11-27", "Devonport Show")):
    add("TAS", d, n, "regional")
add("ACT", "2026-03-09", "Canberra Day")
add("ACT", "2026-06-01", "Reconciliation Day")
add("NT", "2026-05-04", "May Day")
add("NT", "2026-08-03", "Picnic Day")
for d, n in (("2026-07-03", "Alice Springs Show Day"), ("2026-07-10", "Tennant Creek Show Day"), ("2026-07-17", "Katherine Show Day"), ("2026-07-24", "Darwin Show Day"), ("2026-08-14", "Borroloola Show Day")):
    add("NT", d, n, "regional")
add("NT", "2026-12-24", "Christmas Eve - part day holiday (7pm to midnight)", "part_day", 19 * 60)
add("NT", "2026-12-31", "New Year's Eve - part day holiday (7pm to midnight)", "part_day", 19 * 60)

holidays.sort(key=lambda h: (h["date"], h["jurisdiction"], h["name"]))
data.update({
    "coveredYears": [2024, 2025, 2026],
    "source": "2024-2025: data.gov.au Australian Public Holidays Dates Machine Readable Dataset (with corrections); 2026: each state/territory government's official holiday page",
    "fetched": "2026-10-30",
    "holidays": holidays,
})
json.dump(data, open(OUT, "w"), indent=1)
print(len(holidays), "holidays;", sum(h["date"].startswith("2026") for h in holidays), "in 2026")
