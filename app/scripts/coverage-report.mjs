import { readdirSync, readFileSync } from "node:fs";
import istanbulLibCoverage from "istanbul-lib-coverage";
import istanbulLibReport from "istanbul-lib-report";
import reports from "istanbul-reports";

const { createCoverageMap } = istanbulLibCoverage;
const { createContext } = istanbulLibReport;

const OUTPUT_DIR = ".nyc_output";
const THRESHOLDS = { lines: 70, statements: 70, functions: 70, branches: 60 };

const map = createCoverageMap({});
for (const file of readdirSync(OUTPUT_DIR)) {
  if (!file.endsWith(".json")) continue;
  map.merge(JSON.parse(readFileSync(`${OUTPUT_DIR}/${file}`, "utf8")));
}

const context = createContext({ dir: "coverage", coverageMap: map });
reports.create("text").execute(context);
reports.create("html", { subdir: "." }).execute(context);
reports.create("json-summary", { file: "coverage-summary.json" }).execute(context);

const summary = map.getCoverageSummary();
let failed = false;
for (const [key, threshold] of Object.entries(THRESHOLDS)) {
  const pct = summary[key].pct;
  if (pct < threshold) {
    console.error(`ERROR: Coverage for ${key} (${pct}%) does not meet global threshold (${threshold}%)`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("All coverage thresholds met.");
