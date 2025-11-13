import { State } from "../models/location/state.model.js";
import { City } from "../models/location/city.model.js";

// Indian States and Union Territories with their major cities
const indianStatesAndCities = [
  {
    name: "Andhra Pradesh",
    code: "AP",
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
      "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"
    ],
  },
  {
    name: "Arunachal Pradesh",
    code: "AR",
    cities: [
      "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"
    ],
  },
  {
    name: "Assam",
    code: "AS",
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
      "Tinsukia", "Tezpur", "Bongaigaon", "Sivasagar", "Karimganj"
    ],
  },
  {
    name: "Bihar",
    code: "BR",
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
      "Darbhanga", "Arrah", "Begusarai", "Katihar", "Munger"
    ],
  },
  {
    name: "Chhattisgarh",
    code: "CG",
    cities: [
      "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg",
      "Rajpur", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari"
    ],
  },
  {
    name: "Goa",
    code: "GA",
    cities: [
      "Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda"
    ],
  },
  {
    name: "Gujarat",
    code: "GJ",
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
      "Jamnagar", "Gandhinagar", "Junagadh", "Gandhidham", "Anand"
    ],
  },
  {
    name: "Haryana",
    code: "HR",
    cities: [
      "Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar",
      "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"
    ],
  },
  {
    name: "Himachal Pradesh",
    code: "HP",
    cities: [
      "Shimla", "Mandi", "Solan", "Dharamshala", "Bilaspur",
      "Kullu", "Chamba", "Una", "Hamirpur", "Nahan"
    ],
  },
  {
    name: "Jharkhand",
    code: "JH",
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh",
      "Deoghar", "Giridih", "Ramgarh", "Medininagar", "Chaibasa"
    ],
  },
  {
    name: "Karnataka",
    code: "KA",
    cities: [
      "Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum",
      "Gulbarga", "Davangere", "Bellary", "Bijapur", "Raichur"
    ],
  },
  {
    name: "Kerala",
    code: "KL",
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
      "Alappuzha", "Palakkad", "Kannur", "Kottayam", "Malappuram"
    ],
  },
  {
    name: "Madhya Pradesh",
    code: "MP",
    cities: [
      "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain",
      "Raipur", "Sagar", "Ratlam", "Satna", "Burhanpur"
    ],
  },
  {
    name: "Maharashtra",
    code: "MH",
    cities: [
      "Mumbai", "Pune", "Nagpur", "Thane", "Nashik",
      "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli"
    ],
  },
  {
    name: "Manipur",
    code: "MN",
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul"
    ],
  },
  {
    name: "Meghalaya",
    code: "ML",
    cities: [
      "Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar"
    ],
  },
  {
    name: "Mizoram",
    code: "MZ",
    cities: [
      "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib"
    ],
  },
  {
    name: "Nagaland",
    code: "NL",
    cities: [
      "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"
    ],
  },
  {
    name: "Odisha",
    code: "OD",
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
      "Puri", "Baleshwar", "Baripada", "Bhadrak", "Jharsuguda"
    ],
  },
  {
    name: "Punjab",
    code: "PB",
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
      "Pathankot", "Hoshiarpur", "Mohali", "Batala", "Abohar"
    ],
  },
  {
    name: "Rajasthan",
    code: "RJ",
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
      "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"
    ],
  },
  {
    name: "Sikkim",
    code: "SK",
    cities: [
      "Gangtok", "Namchi", "Mangan", "Gyalshing", "Singtam"
    ],
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Erode", "Vellore", "Thanjavur", "Dindigul"
    ],
  },
  {
    name: "Telangana",
    code: "TS",
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam",
      "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"
    ],
  },
  {
    name: "Tripura",
    code: "TR",
    cities: [
      "Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia"
    ],
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    cities: [
      "Lucknow", "Kanpur", "Agra", "Meerut", "Varanasi",
      "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur"
    ],
  },
  {
    name: "Uttarakhand",
    code: "UT",
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
      "Kashipur", "Rishikesh", "Nainital", "Almora", "Pithoragarh"
    ],
  },
  {
    name: "West Bengal",
    code: "WB",
    cities: [
      "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
      "Bardhaman", "Malda", "Kharagpur", "Krishnanagar", "Jalpaiguri"
    ],
  },
  // Union Territories
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    cities: [
      "Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar"
    ],
  },
  {
    name: "Chandigarh",
    code: "CH",
    cities: [
      "Chandigarh"
    ],
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DH",
    cities: [
      "Daman", "Diu", "Silvassa"
    ],
  },
  {
    name: "Delhi",
    code: "DL",
    cities: [
      "New Delhi", "Delhi", "North Delhi", "South Delhi", "East Delhi",
      "West Delhi", "Central Delhi", "Noida", "Gurgaon", "Faridabad"
    ],
  },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    cities: [
      "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore",
      "Kathua", "Udhampur", "Poonch", "Rajouri", "Kupwara"
    ],
  },
  {
    name: "Ladakh",
    code: "LA",
    cities: [
      "Leh", "Kargil"
    ],
  },
  {
    name: "Lakshadweep",
    code: "LD",
    cities: [
      "Kavaratti", "Agatti", "Amini", "Andrott", "Kadmat"
    ],
  },
  {
    name: "Puducherry",
    code: "PY",
    cities: [
      "Puducherry", "Karaikal", "Mahe", "Yanam"
    ],
  },
];

export const seedStatesAndCities = async () => {
  try {
    console.log("🌱 Starting to seed States and Cities...");

    for (const stateData of indianStatesAndCities) {
      // Create or update state
      let state = await State.findOne({ code: stateData.code });

      if (!state) {
        state = await State.create({
          name: stateData.name,
          code: stateData.code,
          status: "Active",
        });
        console.log(`✅ State created: ${stateData.name}`);
      } else {
        // Update if name changed
        if (state.name !== stateData.name) {
          state.name = stateData.name;
          await state.save();
          console.log(`ℹ️ State updated: ${stateData.name}`);
        }
      }

      // Create or update cities for this state
      for (const cityName of stateData.cities) {
        const existingCity = await City.findOne({
          name: cityName,
          stateId: state._id,
        });

        if (!existingCity) {
          await City.create({
            name: cityName,
            stateId: state._id,
            stateName: stateData.name,
            status: "Active",
          });
          console.log(`  ✅ City created: ${cityName}, ${stateData.name}`);
        }
      }
    }

    const totalStates = await State.countDocuments();
    const totalCities = await City.countDocuments();

    console.log(`\n✅ States and Cities seeding completed!`);
    console.log(`   Total States: ${totalStates}`);
    console.log(`   Total Cities: ${totalCities}`);
  } catch (error) {
    console.error("❌ Error seeding states and cities:", error);
    throw error;
  }
};

