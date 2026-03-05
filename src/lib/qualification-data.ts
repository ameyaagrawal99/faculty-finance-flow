export interface QualificationCriteria {
  levelId: string;
  qualifications: string[];
  experience: string;
  tenure: string;
  publications?: string;
  phdRequirement: string;
  otherRequirements?: string[];
  regularizationPath?: string;
  notes?: string[];
}

export interface InstitutionCluster {
  id: string;
  name: string;
  description: string;
  criteria: QualificationCriteria[];
}

export const INSTITUTION_CLUSTERS: InstitutionCluster[] = [
  {
    id: "BITS",
    name: "Engineering / BITS Pilani",
    description: "BITS Pilani and similar technical institutions",
    criteria: [
      {
        levelId: "L10",
        qualifications: [
          "ME/MS/MTech/MPhil/MPharm/MBA or equivalent in relevant discipline",
          "From an institution of high repute",
          "1st Division or 60% in all college/university level degrees",
        ],
        experience: "No prior experience required",
        tenure: "Temporary, 1-year renewable up to 6 years maximum",
        phdRequirement: "Not required but must pursue PhD (50% time for research). Must complete within 6 years.",
        regularizationPath: "Not automatic. Appointment to Level 12+ requires separate selection.",
        notes: [
          "Under Faculty Development Program",
          "Assessed yearly on teaching and research performance",
          "Position ceases on term completion unless renewed",
        ],
      },
      {
        levelId: "L11",
        qualifications: [
          "ME/MS/MTech/MPhil/MPharm/MBA or equivalent in relevant discipline",
          "From an institution of high repute",
          "1st Division or 60% in all college/university level degrees",
        ],
        experience: "No prior experience required",
        tenure: "Maximum 2 years",
        phdRequirement: "PhD thesis submitted or pre-submission formalities completed. Entry pay ₹75,300 without PhD, ₹79,900 with PhD.",
        regularizationPath: "Not automatic. BITS L10 faculty meeting criteria may apply.",
        notes: [
          "Joining subject to PhD thesis submission",
          "Other benefits at par with Level 10",
        ],
      },
      {
        levelId: "L12",
        qualifications: [
          "PhD in relevant discipline from institution of high repute",
          "1st Division or 60% at pre-PhD qualification level",
          "At least 4 publications (2 in international journals)",
        ],
        experience: "PhD holder with < 3 years post-PhD experience (excluding PhD period)",
        tenure: "Temporary against regular position, 3-year assessment period",
        phdRequirement: "PhD required",
        publications: "Minimum 4 publications (2 in international journals)",
        regularizationPath: "Favorable appraisal after 3 years → placed at Level 13A1. Unfavorable → appointment ceases in 6 months.",
      },
      {
        levelId: "L13A1",
        qualifications: [
          "Same as Level 12",
          "3 years experience as Assistant Professor Grade-I in Level 12",
          "From institution of high repute",
        ],
        experience: "3 years as Assistant Professor Grade-I in Level 12",
        tenure: "Temporary against regular position, 1-3 year assessment",
        phdRequirement: "PhD required",
        regularizationPath: "Regular after favorable assessment (1-3 years based on experience and performance).",
        notes: ["Appointment at discretion of faculty selection committee"],
      },
      {
        levelId: "L13A2",
        qualifications: [
          "PhD in relevant discipline from institution of high repute",
          "1st Division or 60% at pre-PhD qualification level",
          "At least 10 publications (5 in international journals)",
        ],
        experience: "6 years post-PhD, of which 3 years at Level 13A1 or equivalent",
        tenure: "Temporary against regular position, 1-year assessment",
        phdRequirement: "PhD required",
        publications: "Minimum 10 publications (5 in international journals)",
        otherRequirements: [
          "Guided at least 1 PhD student (independently or jointly)",
          "Completed at least 1 sponsored R&D project ≥ ₹5L as PI (or 2 as Co-PI)",
          "Demonstrated excellence in teaching, research and sponsored R&D",
        ],
        regularizationPath: "Regular after favorable 1-year assessment.",
      },
      {
        levelId: "L14A",
        qualifications: [
          "PhD in relevant discipline from institution of high repute",
          "1st Division at pre-PhD qualification level",
          "At least 20 publications (10 in international journals)",
        ],
        experience: "10 years post-PhD, of which 4 years at Level 13A2 or equivalent",
        tenure: "Temporary against regular position, 1-year assessment",
        phdRequirement: "PhD required",
        publications: "Minimum 20 publications (10 in international journals)",
        otherRequirements: [
          "Guided at least 1 PhD student independently (or 2 jointly)",
          "Completed at least 2 sponsored R&D projects ≥ ₹5L each as PI (or 1 PI + 2 Co-PI)",
          "Sustained excellence in teaching, research, sponsored R&D",
          "Potential for leadership in research, education and institution building",
        ],
        regularizationPath: "Regular after favorable 1-year assessment.",
      },
      {
        levelId: "L15",
        qualifications: [
          "At least 6 years as Professor at BITS or equivalent",
        ],
        experience: "6 years as Professor",
        tenure: "Temporary against regular position, 1-year assessment",
        phdRequirement: "PhD required",
        otherRequirements: [
          "Demonstrated leadership in Research, Education and Institution building",
        ],
        regularizationPath: "Regular after favorable 1-year assessment.",
        notes: [
          "Exception: Selection Committee may relax qualifications and award additional increments",
          "Outstanding engineers/technologists from industry may be considered without PhD if significant contribution documented",
        ],
      },
    ],
  },
];

export function getQualificationsForLevel(levelId: string, clusterId: string = "BITS"): QualificationCriteria | undefined {
  const cluster = INSTITUTION_CLUSTERS.find((c) => c.id === clusterId);
  if (!cluster) return undefined;
  return cluster.criteria.find((c) => c.levelId === levelId);
}

export function getClusterById(clusterId: string): InstitutionCluster | undefined {
  return INSTITUTION_CLUSTERS.find((c) => c.id === clusterId);
}
