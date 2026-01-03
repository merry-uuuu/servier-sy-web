// DEMO 시트 전용: 헤더 변경 및 값 변환
export const DEMO_HEADER_RENAMES: Record<string, string> = {
  DEPT_RECEIPT_NO: "MFDS_RECEIPT_NO",
  SFRPNO: "MANUF_CASE_NO",
  RPT_DL_DT: "SUBMISSION DATE TO CA",
  RPT_TY: "REPORT_TYPE",
  ADRSE_STUDY_TYP: "STUDY_TYPE",
  ADRSE_STUDY_LWPRT_TYP: "STUDY TYPE_DETAIL",
  LTRTRE_INFO: "LITERATURE_INFO",
  CLIENT_STUDY_NO: "STUDY_PROTOCOL_NO",
  FIRST_OCCR_DT: "INITIAL_RECEIPT_DATE",
  RECENT_OCCR_DT: "RECENT_RECEIPT_DATE",
  QCK_RPT_YN: "EXPEDITED",
  SFRPNO_2: "CASE_NO_OF_REFERENCE_REPORT",
  REPRT_CHANGE_CD: "NULLIFICATION_AMENDMENT",
  PRMRPT_TY: "PRIMARY_REPORTER",
  PRMRPT_LWPRT_CD: "PRIMARY_REPORTER_OTHER_HCP",
  SENDER_TY: "SENDER_TYPE",
  SENDER_TY_MED_EXPERT: "SENDER_TYPE_HCP DETAIL",
  PTNT_OCCURSYMT_AGE: "PATIENT AGE AT OCCURRENCE",
  PTNT_OCCURSYMT_AGE_UNIT: "PATIENT AGE AT OCCURRENCE_UNIT",
  PTNT_AGRDE: "PATIENT AGE GROUP",
  PTNT_BRTYR_YYYY: "PATIENT BIRTH YEAR",
  PTNT_SEX: "PATIENT SEX",
  PTNT_WEIGHT: "PATIENT WEIGHT",
  PTNT_HEIGHT: "PATIENT HEIGHT",
  OCCURSYMT_PREG_TRM: "PREGNANCY_TERM_OCCURRENCE",
  OCCURSYMT_PREG_TRM_UNIT: "PREGNANCY_TERM_OCCURRENCE_UNIT",
};

//열1
export const REPORT_TYPE_MAP: Record<string, string> = {
  "1": "Spontaneous",
  "2": "Clinical trial/study",
  "3": "Others",
};

//열2
export const STUDY_TYPE_MAP: Record<string, string> = {
  "1": "Clinical trial",
  "2": "Individual patient use",
  "3": "Other study",
};

//열3
export const STUDY_TYPE_DETAIL_MAP: Record<string, string> = {
  "1": "Re-examination-Post-marketing surveillance",
  "2": "Re-examination-Post-marketing clinical study",
  "3": "Re-examination-Special investigation",
  "4": "Others",
};

//열4
export const NULLIFICATION_AMENDMENT_MAP: Record<string, string> = {
  "1": "Delete",
  "2": "Amendment",
};

//열5
export const PRIMARY_REPORTER_MAP: Record<string, string> = {
  "1": "Doctor, Dentist, Oriental doctor",
  "2": "Pharmacist, Herbal pharmacist",
  "3": "Other HCP",
  "4": "Lawyer",
  "5": "Consumer or other non-HCP",
  UNK: "Unknown",
};

//열6
export const PRIMARY_REPORTER_OTHER_HCP_MAP: Record<string, string> = {
  "1": "Nurse",
  "2": "Others",
};

//열7
export const SENDER_TYPE_MAP: Record<string, string> = {
  "1": "Pharmaceutical company",
  "2": "Competent authority",
  "3": "HCP",
  "4": "Regional pharmacovigilance center",
  "5": "WHO Uppsala Monitoring Centre",
  "6": "Others(eg. Distributor or other organization)",
  "7": "Patient/consumer",
};

//열8
export const SENDER_TYPE_HCP_DETAIL_MAP: Record<string, string> = {
  "1": "Hospital",
  "2": "Pharmacy",
  "3": "Public health center",
  "4": "Others",
};

//열9
export const PATIENT_AGE_AT_OCCURRENCE_UNIT_MAP: Record<string, string> = {
  "00105": "hours",
  "00107": "days",
  "00108": "weeks",
  "00106": "months",
  "00103": "years",
  "00009": "decades",
};

//열10
export const PATIENT_AGE_GROUP_MAP: Record<string, string> = {
  "0": "fetus",
  "1": "newborn(birth date~less than 28days)",
  "2": "infant(28days~less than 24 months)",
  "3": "children(24months~less than 12  years old)",
  "4": "adolescent(12 years~less than 19 years old)",
  "5": "adult(19 years~less than 65 years old)",
  "6": "geriatrics(more than 65 years old)",
};

//열11
export const PATIENT_SEX_MAP: Record<string, string> = {
  "1": "male",
  "2": "female",
};

//열12
export const PREGNANCY_TERM_OCCURRENCE_UNIT_MAP: Record<string, string> = {
  "00109": "seconds",
  "00104": "minutes",
  "00105": "hours",
  "00107": "days",
  "00108": "weeks",
  "00106": "months",
  "00103": "years",
  "00009": "decades",
  "00010": "trimester",
  "00011": "periodically",
  "00012": "if necessary",
  "00013": "total",
};
