import construction from "@/assets/workers/construction.jpg";
import hospitality from "@/assets/workers/hospitality.jpg";
import retail from "@/assets/workers/retail.jpg";
import healthcare from "@/assets/workers/healthcare.jpg";
import manufacturing from "@/assets/workers/manufacturing.jpg";
import transport from "@/assets/workers/transport.jpg";
import agriculture from "@/assets/workers/agriculture.jpg";
import education from "@/assets/workers/education.jpg";

export type IndustryId =
  | "construction" | "hospitality" | "retail" | "healthcare" | "manufacturing"
  | "transport" | "agriculture" | "education" | "other";

export interface Industry {
  id: IndustryId;
  label: string;
  image?: string;
  /** Short contextual line shown on later screens. */
  blurb: string;
  /** Role suggestions — the user always confirms; never treated as the award. */
  roles: string[];
  /** Extras commonly worth asking about in this industry. */
  extras: string[];
  /** What the check typically looks at. */
  checks: string[];
}

const common = ["Saturday or Sunday", "Public holidays", "Night shifts (8pm–6am)", "More than 10 hours in a day"];

export const INDUSTRIES: Industry[] = [
  { id: "construction", label: "Construction", image: construction, blurb: "Common extras for construction workers — we'll check for these.",
    roles: ["Labourer", "Carpenter", "Electrician", "Plumber", "Site supervisor"],
    extras: [...common, "Use your own tools", "Drive your own car for work", "Work at heights"],
    checks: ["Overtime rates", "Weekend penalties", "Tool allowances", "Travel allowances", "RDO accruals"] },
  { id: "hospitality", label: "Hospitality", image: hospitality, blurb: "Late nights and weekends are where hospitality pay often slips.",
    roles: ["Barista", "Waiter", "Bartender", "Cook", "Kitchen hand"],
    extras: [...common, "Split shifts", "Buy or wash your own uniform"],
    checks: ["Weekend and evening penalties", "Casual loading", "Split-shift allowance", "Uniform allowance"] },
  { id: "retail", label: "Retail", image: retail, blurb: "Retail rates change by day and time — we'll look at each shift.",
    roles: ["Retail assistant", "Checkout operator", "Store supervisor", "Stock replenishment"],
    extras: [...common, "Late-night trading", "Handle cash or open/close the store"],
    checks: ["Evening penalties", "Weekend penalties", "Casual loading", "Junior rates"] },
  { id: "healthcare", label: "Healthcare", image: healthcare, blurb: "Shift work in care roles often has extra penalties and allowances.",
    roles: ["Nurse", "Aged care worker", "Disability support worker", "Personal care assistant"],
    extras: [...common, "Sleepover shifts", "Use your car between clients", "On-call"],
    checks: ["Shift penalties", "Sleepover allowances", "Vehicle allowances", "Broken-shift rules"] },
  { id: "manufacturing", label: "Manufacturing", image: manufacturing, blurb: "Rotating shifts and overtime are common in manufacturing.",
    roles: ["Process worker", "Machine operator", "Forklift driver", "Production supervisor"],
    extras: [...common, "Rotating shifts", "Wear protective gear"],
    checks: ["Shift loadings", "Overtime rates", "Meal allowances"] },
  { id: "transport", label: "Transport", image: transport, blurb: "Long days on the road can mean overtime and meal allowances.",
    roles: ["Truck driver", "Delivery driver", "Warehouse worker", "Storeperson"],
    extras: [...common, "Overnight away from home", "Load or unload"],
    checks: ["Overtime rates", "Meal allowances", "Overnight allowances"] },
  { id: "agriculture", label: "Agriculture", image: agriculture, blurb: "Seasonal and piece-rate work still has minimum hourly rates.",
    roles: ["Farm hand", "Fruit picker", "Livestock worker", "Machinery operator"],
    extras: [...common, "Paid by piece rate", "Live on site"],
    checks: ["Minimum hourly rates", "Piece-rate rules", "Overtime"] },
  { id: "education", label: "Education", image: education, blurb: "Education roles cover teachers, assistants and early childhood staff.",
    roles: ["Teacher", "Teacher's aide", "Early childhood educator", "Tutor"],
    extras: [...common, "First aid responsibility", "Excursions or camps"],
    checks: ["Classification level", "Overtime", "Allowances"] },
  { id: "other", label: "Other", blurb: "Tell us about your job and we'll help you find the right questions.",
    roles: [], extras: common, checks: ["Overtime rates", "Weekend penalties", "Allowances"] },
];

export const industryById = (id?: string | null) => INDUSTRIES.find((i) => i.id === id);
