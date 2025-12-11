// Pennsylvania Counties with FIPS codes and District assignments
// Based on PennDOT Engineering District map

export interface CountyData {
  name: string;
  fipsCode: string; // 5-digit FIPS (state + county)
  district: number; // PennDOT district number
}

export interface DistrictData {
  number: number;
  name: string;
  counties: string[]; // County names
}

// All 66 Pennsylvania counties with their district assignments
export const PENNSYLVANIA_COUNTIES: CountyData[] = [
  // District 1
  { name: "Crawford", fipsCode: "42039", district: 1 },
  { name: "Erie", fipsCode: "42049", district: 1 },
  { name: "Forest", fipsCode: "42053", district: 1 },
  { name: "Mercer", fipsCode: "42085", district: 1 },
  { name: "Venango", fipsCode: "42121", district: 1 },
  { name: "Warren", fipsCode: "42123", district: 1 },
  
  // District 2
  { name: "Cameron", fipsCode: "42023", district: 2 },
  { name: "Centre", fipsCode: "42027", district: 2 },
  { name: "Clearfield", fipsCode: "42033", district: 2 },
  { name: "Clinton", fipsCode: "42035", district: 2 },
  { name: "Elk", fipsCode: "42047", district: 2 },
  { name: "Jefferson", fipsCode: "42065", district: 2 },
  { name: "McKean", fipsCode: "42083", district: 2 },
  { name: "Potter", fipsCode: "42105", district: 2 },
  
  // District 3
  { name: "Bradford", fipsCode: "42015", district: 3 },
  { name: "Columbia", fipsCode: "42037", district: 3 },
  { name: "Lycoming", fipsCode: "42081", district: 3 },
  { name: "Montour", fipsCode: "42093", district: 3 },
  { name: "Northumberland", fipsCode: "42097", district: 3 },
  { name: "Snyder", fipsCode: "42109", district: 3 },
  { name: "Sullivan", fipsCode: "42113", district: 3 },
  { name: "Tioga", fipsCode: "42117", district: 3 },
  { name: "Union", fipsCode: "42119", district: 3 },
  
  // District 4
  { name: "Lackawanna", fipsCode: "42069", district: 4 },
  { name: "Luzerne", fipsCode: "42079", district: 4 },
  { name: "Pike", fipsCode: "42103", district: 4 },
  { name: "Susquehanna", fipsCode: "42115", district: 4 },
  { name: "Wayne", fipsCode: "42127", district: 4 },
  { name: "Wyoming", fipsCode: "42131", district: 4 },
  
  // District 5
  { name: "Berks", fipsCode: "42011", district: 5 },
  { name: "Carbon", fipsCode: "42025", district: 5 },
  { name: "Lehigh", fipsCode: "42077", district: 5 },
  { name: "Monroe", fipsCode: "42089", district: 5 },
  { name: "Northampton", fipsCode: "42095", district: 5 },
  { name: "Schuylkill", fipsCode: "42107", district: 5 },
  
  // District 6
  { name: "Bucks", fipsCode: "42017", district: 6 },
  { name: "Chester", fipsCode: "42029", district: 6 },
  { name: "Delaware", fipsCode: "42045", district: 6 },
  { name: "Montgomery", fipsCode: "42091", district: 6 },
  { name: "Philadelphia", fipsCode: "42101", district: 6 },
  
  // District 8
  { name: "Adams", fipsCode: "42001", district: 8 },
  { name: "Cumberland", fipsCode: "42041", district: 8 },
  { name: "Dauphin", fipsCode: "42043", district: 8 },
  { name: "Franklin", fipsCode: "42055", district: 8 },
  { name: "Lancaster", fipsCode: "42071", district: 8 },
  { name: "Lebanon", fipsCode: "42075", district: 8 },
  { name: "Perry", fipsCode: "42099", district: 8 },
  { name: "York", fipsCode: "42133", district: 8 },
  
  // District 9
  { name: "Bedford", fipsCode: "42009", district: 9 },
  { name: "Blair", fipsCode: "42013", district: 9 },
  { name: "Cambria", fipsCode: "42021", district: 9 },
  { name: "Fulton", fipsCode: "42057", district: 9 },
  { name: "Huntingdon", fipsCode: "42061", district: 9 },
  { name: "Juniata", fipsCode: "42067", district: 9 },
  { name: "Mifflin", fipsCode: "42087", district: 9 },
  { name: "Somerset", fipsCode: "42111", district: 9 },
  
  // District 10
  { name: "Armstrong", fipsCode: "42005", district: 10 },
  { name: "Beaver", fipsCode: "42007", district: 10 },
  { name: "Butler", fipsCode: "42019", district: 10 },
  { name: "Clarion", fipsCode: "42031", district: 10 },
  { name: "Indiana", fipsCode: "42063", district: 10 },
  { name: "Lawrence", fipsCode: "42073", district: 10 },
  
  // District 11
  { name: "Allegheny", fipsCode: "42003", district: 11 },
  
  // District 12
  { name: "Fayette", fipsCode: "42051", district: 12 },
  { name: "Greene", fipsCode: "42059", district: 12 },
  { name: "Washington", fipsCode: "42125", district: 12 },
  { name: "Westmoreland", fipsCode: "42129", district: 12 },
];

// Pennsylvania districts summary
export const PENNSYLVANIA_DISTRICTS: DistrictData[] = [
  { number: 1, name: "District 1-0", counties: ["Crawford", "Erie", "Forest", "Mercer", "Venango", "Warren"] },
  { number: 2, name: "District 2-0", counties: ["Cameron", "Centre", "Clearfield", "Clinton", "Elk", "Jefferson", "McKean", "Potter"] },
  { number: 3, name: "District 3-0", counties: ["Bradford", "Columbia", "Lycoming", "Montour", "Northumberland", "Snyder", "Sullivan", "Tioga", "Union"] },
  { number: 4, name: "District 4-0", counties: ["Lackawanna", "Luzerne", "Pike", "Susquehanna", "Wayne", "Wyoming"] },
  { number: 5, name: "District 5-0", counties: ["Berks", "Carbon", "Lehigh", "Monroe", "Northampton", "Schuylkill"] },
  { number: 6, name: "District 6-0", counties: ["Bucks", "Chester", "Delaware", "Montgomery", "Philadelphia"] },
  { number: 8, name: "District 8-0", counties: ["Adams", "Cumberland", "Dauphin", "Franklin", "Lancaster", "Lebanon", "Perry", "York"] },
  { number: 9, name: "District 9-0", counties: ["Bedford", "Blair", "Cambria", "Fulton", "Huntingdon", "Juniata", "Mifflin", "Somerset"] },
  { number: 10, name: "District 10-0", counties: ["Armstrong", "Beaver", "Butler", "Clarion", "Indiana", "Lawrence"] },
  { number: 11, name: "District 11-0", counties: ["Allegheny"] },
  { number: 12, name: "District 12-0", counties: ["Fayette", "Greene", "Washington", "Westmoreland"] },
];

// US States for seeding (with FIPS codes)
export const US_STATES = [
  { name: "Alabama", abbreviation: "AL", fipsCode: "01" },
  { name: "Alaska", abbreviation: "AK", fipsCode: "02" },
  { name: "Arizona", abbreviation: "AZ", fipsCode: "04" },
  { name: "Arkansas", abbreviation: "AR", fipsCode: "05" },
  { name: "California", abbreviation: "CA", fipsCode: "06" },
  { name: "Colorado", abbreviation: "CO", fipsCode: "08" },
  { name: "Connecticut", abbreviation: "CT", fipsCode: "09" },
  { name: "Delaware", abbreviation: "DE", fipsCode: "10" },
  { name: "Florida", abbreviation: "FL", fipsCode: "12" },
  { name: "Georgia", abbreviation: "GA", fipsCode: "13" },
  { name: "Hawaii", abbreviation: "HI", fipsCode: "15" },
  { name: "Idaho", abbreviation: "ID", fipsCode: "16" },
  { name: "Illinois", abbreviation: "IL", fipsCode: "17" },
  { name: "Indiana", abbreviation: "IN", fipsCode: "18" },
  { name: "Iowa", abbreviation: "IA", fipsCode: "19" },
  { name: "Kansas", abbreviation: "KS", fipsCode: "20" },
  { name: "Kentucky", abbreviation: "KY", fipsCode: "21" },
  { name: "Louisiana", abbreviation: "LA", fipsCode: "22" },
  { name: "Maine", abbreviation: "ME", fipsCode: "23" },
  { name: "Maryland", abbreviation: "MD", fipsCode: "24" },
  { name: "Massachusetts", abbreviation: "MA", fipsCode: "25" },
  { name: "Michigan", abbreviation: "MI", fipsCode: "26" },
  { name: "Minnesota", abbreviation: "MN", fipsCode: "27" },
  { name: "Mississippi", abbreviation: "MS", fipsCode: "28" },
  { name: "Missouri", abbreviation: "MO", fipsCode: "29" },
  { name: "Montana", abbreviation: "MT", fipsCode: "30" },
  { name: "Nebraska", abbreviation: "NE", fipsCode: "31" },
  { name: "Nevada", abbreviation: "NV", fipsCode: "32" },
  { name: "New Hampshire", abbreviation: "NH", fipsCode: "33" },
  { name: "New Jersey", abbreviation: "NJ", fipsCode: "34" },
  { name: "New Mexico", abbreviation: "NM", fipsCode: "35" },
  { name: "New York", abbreviation: "NY", fipsCode: "36" },
  { name: "North Carolina", abbreviation: "NC", fipsCode: "37" },
  { name: "North Dakota", abbreviation: "ND", fipsCode: "38" },
  { name: "Ohio", abbreviation: "OH", fipsCode: "39" },
  { name: "Oklahoma", abbreviation: "OK", fipsCode: "40" },
  { name: "Oregon", abbreviation: "OR", fipsCode: "41" },
  { name: "Pennsylvania", abbreviation: "PA", fipsCode: "42" },
  { name: "Rhode Island", abbreviation: "RI", fipsCode: "44" },
  { name: "South Carolina", abbreviation: "SC", fipsCode: "45" },
  { name: "South Dakota", abbreviation: "SD", fipsCode: "46" },
  { name: "Tennessee", abbreviation: "TN", fipsCode: "47" },
  { name: "Texas", abbreviation: "TX", fipsCode: "48" },
  { name: "Utah", abbreviation: "UT", fipsCode: "49" },
  { name: "Vermont", abbreviation: "VT", fipsCode: "50" },
  { name: "Virginia", abbreviation: "VA", fipsCode: "51" },
  { name: "Washington", abbreviation: "WA", fipsCode: "53" },
  { name: "West Virginia", abbreviation: "WV", fipsCode: "54" },
  { name: "Wisconsin", abbreviation: "WI", fipsCode: "55" },
  { name: "Wyoming", abbreviation: "WY", fipsCode: "56" },
  { name: "District of Columbia", abbreviation: "DC", fipsCode: "11" },
];

// Helper to get counties for a district
export function getCountiesForDistrict(districtNumber: number): CountyData[] {
  return PENNSYLVANIA_COUNTIES.filter(c => c.district === districtNumber);
}

// Helper to get district for a county
export function getDistrictForCounty(countyName: string): number | undefined {
  const county = PENNSYLVANIA_COUNTIES.find(
    c => c.name.toLowerCase() === countyName.toLowerCase()
  );
  return county?.district;
}
