import { addDays, monthSequence, today } from "./utils";


const baseProperties = [
  {
    id: 1, buildingId: "b1", title: "Penthouse Torre Lago Azul", zone: "El Milagro", price: 485000,
    beds: 4, baths: 5, area: 320, parking: 3, year: 2022, fee: 420,
    tag: "Destacado", kind: "penthouse", featured: true,
    palette: ["#FFD27A", "#0B3C6B", "#0B1F3A"],
    blurb: "Terraza panorámica con vista al Lago, ascensor privado y dos puestos techados.",
    description: "Penthouse de dos niveles con terraza panorámica sobre el Lago de Maracaibo. Cocina integrada, ascensor privado y acabados de primera en todos los ambientes.",
    features: ["Terraza panorámica", "Ascensor privado", "Planta eléctrica 100 %", "Seguridad 24 horas"],
  },
  {
    id: 2, buildingId: "b3", title: "Residencia Valle Frío", zone: "Valle Frío", price: 265000,
    beds: 3, baths: 3, area: 210, parking: 2, year: 2020, fee: 150,
    tag: "Nuevo", kind: "casa", featured: true,
    palette: ["#BFE6F5", "#0077B6", "#0B1F3A"],
    blurb: "Jardín privado en conjunto cerrado con vigilancia las 24 horas.",
    description: "Casa de un solo nivel en conjunto cerrado, pensada para la vida en familia: jardín privado, cocina integrada a la sala y un área social que se abre al exterior.",
    features: ["Jardín privado", "Conjunto cerrado con vigilancia", "Cocina integrada", "Tanque de agua de 10.000 L"],
  },
  {
    id: 3, buildingId: "b2", title: "Apartamento Bella Vista", zone: "Bella Vista", price: 148000,
    beds: 2, baths: 2, area: 115, parking: 1, year: 2019, fee: 160,
    tag: "Disponible", kind: "torre", featured: true,
    palette: ["#FFE29A", "#2F7FC1", "#10294A"],
    blurb: "Piso alto con porcelanato y todas las amenidades de la torre.",
    description: "Apartamento en piso alto con buena iluminación natural y vista abierta. Porcelanato en toda la unidad y acceso a las amenidades de la torre.",
    features: ["Piso alto con vista", "Porcelanato en toda la unidad", "Piscina y gimnasio en la torre", "Planta eléctrica 100 %"],
  },
  {
    id: 4, title: "Loft Cecilio Acosta", zone: "Cecilio Acosta", price: 96000,
    beds: 1, baths: 1, area: 78, parking: 1, year: 2021, fee: 90,
    tag: "Disponible", kind: "torre",
    palette: ["#CDE9F7", "#4F7CAC", "#0E2742"],
    description: "Loft de doble altura ideal para una persona o una pareja. Espacios abiertos, cocina americana y estacionamiento techado dentro del edificio.",
    features: ["Doble altura", "Cocina americana", "Estacionamiento techado", "Conserjería"],
  },
  {
    id: 5, title: "Casa Pomona", zone: "Pomona", price: 340000,
    beds: 4, baths: 4, area: 380, parking: 3, year: 2018, fee: 110,
    tag: "Exclusiva", kind: "casa",
    palette: ["#FFD27A", "#1D6FA5", "#0B1F3A"],
    description: "Casa amplia con piscina privada y área de parrillera, perfecta para reunir a la familia. Cuarto de servicio y jardín de gran tamaño.",
    features: ["Piscina privada", "Área de parrillera", "Cuarto de servicio", "Jardín amplio"],
  },
  {
    id: 6, title: "Apartamento 5 de Julio", zone: "5 de Julio", price: 182000,
    beds: 3, baths: 2, area: 140, parking: 2, year: 2017, fee: 130,
    tag: "Financiable", kind: "torre",
    palette: ["#D6EEF8", "#0096C7", "#0B1F3A"],
    description: "Apartamento remodelado en una de las avenidas más conocidas de la ciudad, con balcón y cocina nueva. Cerca de comercios, colegios y clínicas.",
    features: ["Cocina remodelada", "Balcón", "Pozo y tanque de agua", "Vigilancia 24 horas"],
  },
  {
    id: 7, title: "Apartamento La Lago", zone: "La Lago", price: 210000,
    beds: 3, baths: 3, area: 160, parking: 2, year: 2021, fee: 175,
    tag: "Nuevo", kind: "torre",
    palette: ["#CFE9F7", "#1D6FA5", "#0B1F3A"],
    description: "Apartamento moderno en una torre con salón de eventos y gimnasio. Ambientes amplios, ventanales y una vista privilegiada hacia el Lago.",
    features: ["Vista al Lago", "Salón de eventos", "Gimnasio", "Planta eléctrica 100 %"],
  },
  {
    id: 8, title: "Casa Cumbres de Maracaibo", zone: "Cumbres de Maracaibo", price: 198000,
    beds: 3, baths: 2, area: 220, parking: 2, year: 2016, fee: 80,
    tag: "Financiable", kind: "casa",
    palette: ["#FFE29A", "#2F7FC1", "#10294A"],
    description: "Casa en zona residencial tranquila, con patio y parrillera. Portón eléctrico y espacio para ampliar si la familia crece.",
    features: ["Patio con parrillera", "Cuarto de servicio", "Portón eléctrico", "Zona residencial tranquila"],
  },
  {
    id: 9, title: "Dúplex Las Delicias", zone: "Las Delicias", price: 275000,
    beds: 3, baths: 3, area: 230, parking: 2, year: 2020, fee: 210,
    tag: "Última unidad", kind: "penthouse",
    palette: ["#FFD27A", "#1D6FA5", "#0B1F3A"],
    description: "Dúplex en los últimos pisos de un edificio con cancha y piscina. Terraza privada y dos niveles que separan la zona social de las habitaciones.",
    features: ["Dos niveles", "Terraza privada", "Cancha y piscina del edificio", "Planta eléctrica 100 %"],
  },
];


const photos = (id, n = 3) => Array.from({ length: n }, (_, i) => `/propiedades/${id}-${i + 1}.jpg`);
export const properties = baseProperties.map((p) => ({ ...p, ownerId: null, images: photos(p.id) }));

export const zoneOptions = ["El Milagro", "Valle Frío", "Bella Vista", "Pomona", "Cecilio Acosta", "5 de Julio", "La Lago", "Cumbres de Maracaibo", "Las Delicias", "Paraíso", "Sabaneta", "Tierra Negra"];
export const methodLabels = { transfer: "Transferencia", mobile: "Pago móvil", card: "Tarjeta", manual: "Registro de administración" };
export const expenseCategories = ["Vigilancia", "Servicios", "Mantenimiento", "Limpieza"];
export const kindLabel = { torre: "Apartamento", casa: "Casa", penthouse: "Penthouse" };
export const priceRanges = [
  { value: "0-150000", label: "Hasta $150,000", min: -1, max: 150000 },
  { value: "150000-300000", label: "$150,000 – $300,000", min: 150000, max: 300000 },
  { value: "300000+", label: "Más de $300,000", min: 300000, max: Infinity },
];
export const palettes = [
  ["#FFD27A", "#0B3C6B", "#0B1F3A"],
  ["#BFE6F5", "#0077B6", "#0B1F3A"],
  ["#FFE29A", "#2F7FC1", "#10294A"],
  ["#CDE9F7", "#4F7CAC", "#0E2742"],
];

export const buildings = [
  { id: "b1", name: "Torre Lago Azul", zone: "El Milagro", address: "Av. El Milagro, Maracaibo" },
  { id: "b2", name: "Residencias Bella Vista", zone: "Bella Vista", address: "Av. Bella Vista, Maracaibo" },
  { id: "b3", name: "Conjunto Valle Frío", zone: "Valle Frío", address: "Sector Valle Frío, Maracaibo" },
];

const plan = {
  piscina: { name: "Piscina", capacity: "Hasta 30 personas", x: 20, y: 20, w: 150, h: 76 },
  salon: { name: "Salón de eventos", capacity: "Hasta 80 personas", x: 186, y: 20, w: 154, h: 76 },
  cancha: { name: "Cancha", capacity: "Hasta 20 personas", x: 20, y: 114, w: 120, h: 86 },
  gym: { name: "Gimnasio", capacity: "Hasta 15 personas", x: 154, y: 114, w: 84, h: 86 },
  bbq: { name: "Terraza BBQ", capacity: "Hasta 25 personas", x: 252, y: 114, w: 88, h: 86 },
};
const mk = (buildingId, keys) => keys.map((k) => ({ id: `${buildingId}-${k}`, buildingId, ...plan[k] }));
export const areas = [
  ...mk("b1", ["piscina", "salon", "cancha", "gym", "bbq"]),
  ...mk("b2", ["piscina", "salon", "gym"]),
  ...mk("b3", ["piscina", "cancha", "bbq"]),
];

export const slots = [
  "Mañana (8:00 a. m. – 12:00 m.)",
  "Tarde (1:00 – 5:00 p. m.)",
  "Noche (6:00 – 10:00 p. m.)",
];
export const banks = ["Banesco", "Mercantil", "Provincial", "Banco de Venezuela", "BNC", "Bancaribe"];
export const MONTHS = [
  "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
  "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
];

const PASS = "Demo#2026";
const users = [
  { id: "u1", role: "admin", name: "Carolina Ferrer", document: "V-15234876", email: "admin@costalago.com", phone: "0414-6543210", password: PASS, buildingIds: ["b1", "b2"] },
  { id: "u2", role: "admin", name: "Luis Medina", document: "V-12984521", email: "luis@costalago.com", phone: "0424-7788990", password: PASS, buildingIds: ["b3"] },
  { id: "u3", role: "resident", name: "Valentina Rojas", document: "V-18765432", email: "valentina@correo.com", phone: "0424-1234567", password: PASS, unitId: "b1-4B", tenure: "Propietaria" },
  { id: "u4", role: "resident", name: "Andrés Molero", document: "V-20456789", email: "andres@correo.com", phone: "0412-3456789", password: PASS, unitId: "b1-6C", tenure: "Inquilino" },
  { id: "u5", role: "resident", name: "María Pérez", document: "V-16345098", email: "maria@correo.com", phone: "0416-5551234", password: PASS, unitId: "b2-2A", tenure: "Propietaria" },
  { id: "u6", role: "resident", name: "Jorge Navarro", document: "V-14876543", email: "jorge@correo.com", phone: "0426-4447788", password: PASS, unitId: "b3-12", tenure: "Propietario" },
  { id: "u7", role: "owner", name: "Sofía Marín", document: "V-17654321", email: "sofia@correo.com", phone: "0414-2223344", password: PASS },
  { id: "u8", role: "superadmin", name: "Gustavo Paredes", document: "V-10234567", email: "super@costalago.com", phone: "0414-1000000", password: PASS },
  { id: "u9", role: "tenant", name: "Carlos Rivas", document: "V-20987654", email: "carlos@correo.com", phone: "0414-5551234", password: PASS },
];

const rng = (seed) => {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
};

const firstNames = ["Luisa", "Carlos", "Ana", "Pedro", "Rosa", "Miguel", "Elena", "Daniel", "Sofía", "Ricardo", "Patricia", "Gabriel", "Laura", "Héctor", "Isabel", "Oscar", "Natalia", "Víctor", "Mariana", "Alberto"];
const lastNames = ["González", "Rodríguez", "Fernández", "López", "Díaz", "Hernández", "Morales", "Castillo", "Vargas", "Ortega", "Silva", "Paredes", "Núñez", "Rivas", "Soto", "Mendoza", "Acosta", "Villalobos", "Colmenares", "Urdaneta"];

const rawUnits = [];
for (const f of [1, 2, 3, 4, 5, 6])
  for (const [l, fee] of [["A", 150], ["B", 150], ["C", 180], ["D", 210]])
    rawUnits.push({ buildingId: "b1", label: `${f}${l}`, fee });
for (const f of [1, 2, 3, 4])
  for (const [l, fee] of [["A", 110], ["B", 120], ["C", 130]])
    rawUnits.push({ buildingId: "b2", label: `${f}${l}`, fee });
for (let n = 1; n <= 14; n++) rawUnits.push({ buildingId: "b3", label: String(n), fee: 80 });

const demoOccupant = Object.fromEntries(users.filter((u) => u.unitId).map((u) => [u.unitId, u.name]));
const units = rawUnits.map((u, i) => {
  const id = `${u.buildingId}-${u.label}`;
  return { id, ...u, occupant: demoOccupant[id] ?? `${firstNames[i % 20]} ${lastNames[(i * 7 + 3) % 20]}` };
});

const payMethods = ["transfer", "mobile", "card"];
const forced = {
  "b1-4B": ["2026-11"], 
  "b1-6C": ["2026-09", "2026-10", "2026-11"],
};
const payments = [];
units.forEach((u, i) => {
  const r = rng(i + 11);
  const chronic = r() < 0.2;
  MONTHS.forEach((month, mi) => {
    const isLast = mi === MONTHS.length - 1;
    const paid = forced[u.id]
      ? !forced[u.id].includes(month)
      : isLast
        ? r() < 0.45
        : r() > (chronic ? 0.4 : 0.05);
    const day = String(1 + Math.floor(r() * 14)).padStart(2, "0");
    const method = payMethods[Math.floor(r() * 3)];
    payments.push({
      id: `p-${u.id}-${month}`,
      unitId: u.id,
      buildingId: u.buildingId,
      month,
      amount: u.fee,
      dueDate: `${month}-15`,
      status: paid ? "paid" : "unpaid",
      paidAt: paid ? `${month}-${day}` : null,
      method: paid ? method : null,
      reference: paid ? `Ref. ${100000 + Math.floor(r() * 899999)}` : null,
    });
  });
});

const categories = [["Vigilancia", 0.26], ["Mantenimiento", 0.18], ["Servicios", 0.18], ["Limpieza", 0.1]];
const expenses = [];
buildings.forEach((b, bi) => {
  const billed = units.filter((u) => u.buildingId === b.id).reduce((s, u) => s + u.fee, 0);
  const r = rng(100 + bi);
  MONTHS.forEach((month) =>
    categories.forEach(([category, share]) =>
      expenses.push({
        id: `e-${b.id}-${month}-${category}`,
        buildingId: b.id,
        month,
        category,
        amount: Math.round(billed * share * (0.9 + r() * 0.2)),
      })
    )
  );
});

const reservations = [
  { id: "r1", buildingId: "b1", areaId: "b1-salon", date: addDays(today(), 2), slot: slots[2], userId: "u4", unitId: "b1-6C" },
  { id: "r2", buildingId: "b1", areaId: "b1-cancha", date: addDays(today(), 2), slot: slots[1], userId: null, unitId: "b1-2A" },
  { id: "r3", buildingId: "b1", areaId: "b1-piscina", date: addDays(today(), 3), slot: slots[0], userId: "u3", unitId: "b1-4B" },
  { id: "r4", buildingId: "b2", areaId: "b2-salon", date: addDays(today(), 4), slot: slots[2], userId: "u5", unitId: "b2-2A" },
  { id: "r5", buildingId: "b3", areaId: "b3-bbq", date: addDays(today(), 1), slot: slots[2], userId: "u6", unitId: "b3-12" },
];

const notices = [
  { id: "n1", buildingId: "b1", title: "Mantenimiento de ascensores", body: "El jueves de 9:00 a. m. a 1:00 p. m. se hará mantenimiento a los dos ascensores. Disculpa las molestias.", date: addDays(today(), -3), authorId: "u1", targetUnitIds: null },
  { id: "n2", buildingId: "b1", title: "Corte de agua programado", body: "El sábado habrá un corte de agua de 8:00 a. m. a 12:00 m. por limpieza de tanques.", date: addDays(today(), -6), authorId: "u1", targetUnitIds: null },
  { id: "n3", buildingId: "b2", title: "Asamblea de propietarios", body: "Te esperamos en la asamblea del próximo viernes a las 7:00 p. m. en el salón de eventos.", date: addDays(today(), -2), authorId: "u1", targetUnitIds: null },
  { id: "n4", buildingId: "b3", title: "Nuevo horario de vigilancia", body: "Desde esta semana el cambio de turno de vigilancia es a las 6:00 a. m. y 6:00 p. m.", date: addDays(today(), -4), authorId: "u2", targetUnitIds: null },
];

const listings = [
  {
    id: 101, ownerId: "u7", buildingId: null, title: "Casa Los Olivos", zone: "Paraíso", price: 158000,
    beds: 3, baths: 2, area: 180, parking: 2, year: 2015, fee: 150, tag: "Nuevo", kind: "casa",
    featured: false, palette: palettes[1], images: [],
    blurb: "Casa de dos niveles con patio, parrillera y cuarto de servicio en zona residencial.",
    description: "Casa de dos niveles en zona residencial, con patio amplio y parrillera. Cuarto de servicio, portón eléctrico y espacio para dos vehículos.",
    features: ["Patio con parrillera", "Cuarto de servicio", "Portón eléctrico"],
  },
];

const inquiries = [
  {
    id: "q1", propertyId: 1, subject: "Penthouse Torre Lago Azul", interest: "Penthouse Torre Lago Azul",
    name: "Pedro Gómez", document: "V-12345678", phone: "0414-1112233", email: "pedro@correo.com",
    message: "Hola, quisiera conocer las condiciones de venta del penthouse y agendar una visita.",
    date: addDays(today(), -1), read: false,
  },
  {
    id: "q2", propertyId: null, subject: null, interest: "Vender mi propiedad",
    name: "Lucía Barboza", document: "V-16987654", phone: "0424-5558899", email: "lucia@correo.com",
    message: "Tengo un apartamento en Bella Vista y me gustaría saber cómo publicarlo con ustedes.",
    date: addDays(today(), -2), read: false,
  },
];

const tenants = [
  { id: "t1", type: "listing", targetId: 101, name: "Carlos Rivas", document: "V-20987654", userId: "u9", rent: 850, addedBy: "u7", date: addDays(today(), -10) },
];

const ownerFeePayments = listings.flatMap((listing) =>
  listing.fee > 0
    ? MONTHS.slice(-3).map((month) => ({
        id: `owner-${listing.id}-${month}`,
        type: "ownerFee",
        ownerId: listing.ownerId,
        listingId: listing.id,
        month,
        amount: listing.fee,
        dueDate: `${month}-15`,
        status: "unpaid",
        paidAt: null,
        method: null,
        reference: null,
      }))
    : []
);

const rentalPayments = tenants.flatMap((tenant) =>
  monthSequence().map((month) => ({
    id: `rent-${tenant.id}-${month}`,
    type: "rent",
    tenantId: tenant.id,
    tenantUserId: tenant.userId,
    ownerId: tenant.addedBy,
    listingId: tenant.type === "listing" ? tenant.targetId : null,
    unitId: tenant.type === "unit" ? tenant.targetId : null,
    month,
    amount: tenant.rent,
    dueDate: `${month}-15`,
    status: "unpaid",
    paidAt: null,
    method: null,
    reference: null,
  }))
);

export const initialState = {
  users, units, payments: [...payments, ...ownerFeePayments, ...rentalPayments], expenses, reservations, notices,
  listings,
  favorites: { u3: [2] },
  inquiries,
  tenants,
};
