export const DRUG_HEADER_RENAMES: Record<string, string> = {
  DRUG_GB: "DRUG_GROUP",
  DRUG_CD: "DRUG_CODE",
  ACCMLT_DOSAGE_QTY: "ACCUMULATE_DOSAGE_SINCE_ONSET",
  ACCMLT_DOSAGE_QTY_UNIT: "ACCUMULATE_DOSAGE_SINCE_ONSET_UNIT",
  DRUG_ACTION: "DRUG_ACTION_TAKEN",
};

export const DRUG_GROUP_MAP: Record<string, string> = {
  "1": "Suspected drug",
  "2": "Concomitant drug",
  "3": "Drug Interaction",
  "4": "Not administered",
};
