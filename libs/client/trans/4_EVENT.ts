export const EVENT_HEADER_RENAMES: Record<string, string> = {
  ADR_MEDDRA_KOR_NM: "ADR_MEDDRA_KOR",
  ADR_MEDDRA_ENG_NM: "ADR_MEDDRA_ENG",
  ADR_START_DT: "ADR_START_DATE",
  ADR_END_DT: "ADR_END_DATE",
  ADR_RESULT_CODE: "ADR_OUTCOME",
  CLNIC_FACT_CONFIRM_YN: "MEDICALLY_CONFIRMED",
  WHOART_ARRN: "WHOART_PT",
  WHOART_SEQ: "WHOART_IT",
  SE_DEATH: "SER_DEATH",
  SE_LIFE_MENACE: "SER_LIFE_THREAT",
  SE_HSPTLZ_EXTN: "SER_HOSPITALIZATION",
  SE_FNCT_DGRD: "SER_DISABILITY",
  SE_ANMLY: "SER_ANOMALY",
  SE_ETC_IMPRTNC_SITTN: "SER_MEDICALLY IMPORTANT",
};

export const ADR_OUTCOME_MAP: Record<string, string> = {
  "1": "resolved",
  "2": "resolving",
  "3": "not resolved",
  "4": "resolved with sequelae",
  "5": "death due to AE/ADR",
  "0": "unknown",
};
