// Uganda districts with real GPS coordinates and local context
export const UGANDA_DISTRICTS = [
    { name: "Kampala", region: "Central", lat: 0.3476, lng: 32.5825, locality: "Nakasero, Kampala" },
    { name: "Wakiso", region: "Central", lat: 0.4022, lng: 32.4597, locality: "Entebbe, Wakiso" },
    { name: "Mukono", region: "Central", lat: 0.3533, lng: 32.7553, locality: "Mukono Town" },
    { name: "Jinja", region: "Eastern", lat: 0.4244, lng: 33.2041, locality: "Jinja City" },
    { name: "Mbale", region: "Eastern", lat: 1.0796, lng: 34.1753, locality: "Mbale City" },
    { name: "Soroti", region: "Eastern", lat: 1.7148, lng: 33.6108, locality: "Soroti City" },
    { name: "Tororo", region: "Eastern", lat: 0.6924, lng: 34.1818, locality: "Tororo Town" },
    { name: "Iganga", region: "Eastern", lat: 0.6094, lng: 33.4686, locality: "Iganga Town" },
    { name: "Gulu", region: "Northern", lat: 2.7809, lng: 32.2994, locality: "Gulu City" },
    { name: "Lira", region: "Northern", lat: 2.2499, lng: 32.8998, locality: "Lira City" },
    { name: "Arua", region: "Northern", lat: 3.0212, lng: 30.9108, locality: "Arua City" },
    { name: "Kitgum", region: "Northern", lat: 3.2836, lng: 32.8873, locality: "Kitgum Town" },
    { name: "Mbarara", region: "Western", lat: -0.6072, lng: 30.6545, locality: "Mbarara City" },
    { name: "Fort Portal", region: "Western", lat: 0.6710, lng: 30.2742, locality: "Fort Portal City" },
    { name: "Kasese", region: "Western", lat: 0.1833, lng: 30.0833, locality: "Kasese Town" },
    { name: "Kabale", region: "Western", lat: -1.2492, lng: 29.9869, locality: "Kabale Town" },
    { name: "Masaka", region: "Central", lat: -0.3383, lng: 31.7370, locality: "Masaka City" },
    { name: "Hoima", region: "Western", lat: 1.4344, lng: 31.3527, locality: "Hoima City" },
    { name: "Bushenyi", region: "Western", lat: -0.5358, lng: 30.1908, locality: "Ishaka, Bushenyi" },
    { name: "Moroto", region: "Northern", lat: 2.5347, lng: 34.6690, locality: "Moroto Town" },
];

// Ugandan first names (common across tribes: Baganda, Acholi, Langi, Banyankole, Basoga, etc.)
export const UGANDA_FIRST_NAMES = [
    "Amos", "Grace", "Sarah", "David", "Harriet", "Robert", "Esther", "John",
    "Prossy", "Moses", "Betty", "Isaac", "Irene", "Daniel", "Annet", "Samuel",
    "Lydia", "Joseph", "Patience", "Emmanuel", "Judith", "Francis", "Aisha",
    "Geoffrey", "Ritah", "Michael", "Christine", "Richard", "Doreen", "Henry",
    "Winnie", "Peter", "Agnes", "Simon", "Juliet", "Paul", "Scovia", "Brian",
    "Immaculate", "Ivan", "Norah", "Ronald", "Flavia", "Alex", "Sylvia", "Rogers"
];

// Ugandan surnames (mix of Luganda, Acholi, Lusoga, Runyankole, etc.)
export const UGANDA_LAST_NAMES = [
    "Nakamya", "Ochieng", "Ssemakula", "Aciro", "Mugisha", "Odongo", "Namutebi",
    "Atim", "Ssewanyana", "Okello", "Nakato", "Oryem", "Kizito", "Auma",
    "Ssebuliba", "Opio", "Namaganda", "Ocen", "Tumwebaze", "Apiyo",
    "Ssengendo", "Ojok", "Nabukenya", "Adong", "Byarugaba", "Omara",
    "Namiiro", "Okwir", "Muwonge", "Akello", "Ssembatya", "Olweny",
    "Namukasa", "Lacor", "Nsubuga", "Awor", "Kibirige", "Ogwang",
    "Nansubuga", "Oloya", "Katumba", "Amuge", "Wasswa", "Achen"
];

export function randomUgandanName() {
    const first = UGANDA_FIRST_NAMES[Math.floor(Math.random() * UGANDA_FIRST_NAMES.length)];
    const last = UGANDA_LAST_NAMES[Math.floor(Math.random() * UGANDA_LAST_NAMES.length)];
    return `${first} ${last}`;
}

export function randomUgandaLocation() {
    const district = UGANDA_DISTRICTS[Math.floor(Math.random() * UGANDA_DISTRICTS.length)];
    // Add small GPS jitter (~1km radius)
    const jitter = () => (Math.random() - 0.5) * 0.02;
    return {
        ...district,
        lat: parseFloat((district.lat + jitter()).toFixed(6)),
        lng: parseFloat((district.lng + jitter()).toFixed(6)),
        accuracy: parseFloat((Math.random() * 30 + 5).toFixed(1)),
    };
}

export function generateSimpleSignature(name) {
    // Generates a minimal canvas-based signature data URL for a given name
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 90;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 300, 90);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 1.5;
    ctx.font = "italic 28px serif";
    ctx.fillStyle = "#1e1b4b";
    ctx.fillText(name.split(" ")[0], 20, 55);
    // Underline squiggle
    ctx.beginPath();
    ctx.moveTo(15, 65);
    for (let x = 15; x < 200; x += 10) {
        ctx.quadraticCurveTo(x + 5, 65 + (Math.random() > 0.5 ? 4 : -4), x + 10, 65);
    }
    ctx.stroke();
    return canvas.toDataURL("image/png");
}