export type Locale = "es" | "en";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type AppRole = "superuser" | "owner_admin" | "limited_user" | "read_only";

export type Priority = "low" | "medium" | "high" | "critical";

export type MaintenanceKind =
  | "preventive"
  | "corrective"
  | "inspection"
  | "review"
  | "upgrade";

export type TaskStatus =
  | "pending"
  | "planned"
  | "in_progress"
  | "done"
  | "cancelled"
  | "postponed";

export type ObservationStatus = "open" | "converted" | "closed" | "cancelled";

export type HaulOutStatus =
  | "planned"
  | "preparing"
  | "in_progress"
  | "closed"
  | "cancelled";

export type PurchaseStatus =
  | "pending"
  | "planned"
  | "ordered"
  | "received"
  | "cancelled";

export type FutureActionKind =
  | "future_maintenance"
  | "upgrade"
  | "review"
  | "administrative"
  | "preparation"
  | "next_haul_out";

// ─── Catalog ──────────────────────────────────────────────────────────────────

export type SystemCatalogEntry = {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
};

export type BoatCatalogOverrideSpare = {
  id: string;
  overrideId: string;
  partName: string;
  partReference: string;
  manufacturer: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
};

export type BoatCatalogOverride = {
  id: string;
  boatId: string;
  templateId: string;
  intervalDays: number | null;
  intervalHours: number | null;
  notes: string | null;
  spares: BoatCatalogOverrideSpare[];
  // joined from maintenance_templates
  template: MaintenanceTemplate;
};

export type MaintenanceTemplate = {
  id: string;
  boatId: string | null;
  createdBy: string | null;
  systemId: string;
  systemCode: string;
  systemNameEs: string;
  systemNameEn: string;
  title: string;
  titleEs: string | null;
  titleEn: string | null;
  description: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  kind: MaintenanceKind;
  defaultPriority: Priority;
  sortOrder: number;
  intervalDays: number | null;
  intervalHours: number | null;
};

export type MaintenanceTemplateSpare = {
  id: string;
  systemId: string;
  templateId: string | null;
  partName: string;
  partReference: string;
  manufacturer: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
};

// ─── Maintenance Schedule Plans (superuser reference plans) ──────────────────

export type SchedulePlan = {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  sortOrder: number;
  items: SchedulePlanItem[];
};

export type SchedulePlanItem = {
  id: string;
  planId: string;
  templateId: string;
  intervalDays: number | null;
  intervalHours: number | null;
  sortOrder: number;
  // joined from maintenance_templates
  template: MaintenanceTemplate;
};

// ─── Boat Maintenance Schedule ────────────────────────────────────────────────

export type BoatScheduleEntry = {
  id: string;
  boatId: string;
  templateId: string;
  intervalDays: number | null;
  intervalHours: number | null;
  lastDoneAt: string | null;
  lastDoneEngineHours: number | null;
  lastDoneNotes: string | null;
  nextDueDate: string | null;
  responsible: string | null;
  notes: string | null;
  // joined
  template: MaintenanceTemplate;
  state: "ok" | "due_soon" | "overdue";
};

// ─── Owner ────────────────────────────────────────────────────────────────────

export type Owner = {
  id: string;
  name: string;
  notes: string | null;
};

// ─── Boat dimensions (ORC schema) ────────────────────────────────────────────

export type BoatDimensions = {
  // Class / builder
  designer?: string | null;
  builder?: string | null;
  seriesDate?: string | null;         // e.g. "01/2006"
  hullConstruction?: string | null;   // e.g. "Cored"
  // Hull
  loa?: number | null;
  maxBeam?: number | null;
  draft?: number | null;
  displacement?: number | null;
  wettedArea?: number | null;
  dlr?: number | null;
  imsL?: number | null;               // IMS L measurement
  // Propeller
  propellerType?: string | null;      // e.g. "Folding 3 blades"
  propellerDiameter?: number | null;  // PRD in m
  // Crew
  crewMaxWeight?: number | null;
  crewMinWeight?: number | null;
  // Rig (ORC measurement letters)
  P?: number | null;    // Mainsail hoist
  E?: number | null;    // Mainsail foot
  IG?: number | null;   // Foretriangle height (deck)
  ISP?: number | null;  // Foretriangle height (spinnaker)
  J?: number | null;    // Foretriangle base
  BAS?: number | null;  // Boom above sheer
  TPS?: number | null;  // Tackline to pole support
  TL?: number | null;   // Trunk length
  MW?: number | null;   // Maximum mast width
  GO?: number | null;   // Gooseneck offset
  BD?: number | null;   // Boom depth
  MWT?: number | null;  // Mast weight (kg)
  MCG?: number | null;  // Mast center of gravity
  // Stability
  rmRated?: number | null;
  stabilityIndex?: number | null;
  lps?: number | null;
  // Sail areas (m²)
  mainsailMeasured?: number | null;
  mainsailRated?: number | null;
  headsailMeasured?: number | null;
  headsailRated?: number | null;
  asymmetricMeasured?: number | null;
  asymmetricRated?: number | null;
  trysail?: number | null;
  stormJib?: number | null;
  heavyJib?: number | null;
  // Sail limits
  headsailLimit?: number | null;      // max number of headsails
  spinnakersLimit?: number | null;    // max number of spinnakers
  // ORC ratings & time allowances
  imsClass?: string | null;
  orcGph?: number | null;
  orcAph?: number | null;
  orcCdl?: number | null;
  certNo?: string | null;
  certIssueDate?: string | null;
  certValidUntil?: string | null;
  orcDynamicAllowance?: number | null;   // %
  orcAgeAllowance?: number | null;       // %
  spreadersCount?: number | null;
  carbonMast?: boolean | null;
  headsailFurler?: boolean | null;
  mainsailFurler?: boolean | null;
  // Sail inventory
  sails?: SailInventoryItem[] | null;
  // VPP polar data (wind speeds 6,8,10,12,14,16,20 kt)
  polarWindSpeeds?: number[] | null;
  polarBeatAngles?: number[] | null;
  polarBeatVmg?: number[] | null;
  polarRunVmg?: number[] | null;
  polarGybeAngles?: number[] | null;
  polarRows?: PolarRow[] | null;
};

export type PolarRow = {
  twa: number;           // True wind angle (degrees)
  speeds: number[];      // Boat speeds at each wind speed
};

export type SailInventoryItem = {
  id: string;
  label: string;                        // e.g. "Mayor", "Génova nº1", "Code Zero"
  sailType: "mainsail" | "headsail" | "spinnaker_sym" | "spinnaker_asym" | "code_zero" | "gennaker" | "trysail" | "storm_jib" | "other";
  sailNumber?: string | null;           // e.g. "ESP-10343"
  material?: string | null;             // e.g. "Dacron", "Laminado"
  manufacturer?: string | null;
  year?: number | null;
  // Measurements (m)
  luff?: number | null;                 // Grátil
  leech?: number | null;                // Baluma
  foot?: number | null;                 // Pujamen
  area?: number | null;                 // m² medida
  lpPercent?: number | null;            // LP% (solapamiento génova)
  slu?: number | null;                  // Spinnaker luff
  sle?: number | null;                  // Spinnaker leech
  sl?: number | null;                   // Spinnaker length
  shw?: number | null;                  // Spinnaker half width
  sfl?: number | null;                  // Spinnaker foot length
  condition?: "new" | "good" | "fair" | "worn" | null;
  notes?: string | null;
};

export type TankType = "diesel" | "fresh_water" | "grey_water" | "black_water" | "lpg" | "other";

export type BoatTank = {
  id: string;
  type: TankType;
  label: string;
  capacity: number;
  unit: "L" | "gal";
  material?: string | null;
  notes?: string | null;
};

export type BoatIdentifiers = {
  mmsi?: string | null;
  callSign?: string | null;
  imoNumber?: string | null;
  intNominativo?: string | null;
  winCode?: string | null;
  atcnRef?: string | null;
};

export type BoatDocType =
  | "insurance"
  | "tepai"
  | "seaworthiness"
  | "vhf_license"
  | "customs"
  | "crew_list"
  | "radio_license"
  | "safety_cert"
  | "other";

export type BoatDocument = {
  id: string;
  boatId: string;
  docType: BoatDocType;
  label: string;
  storagePath: string | null;
  expiryDate: string | null;
  issuedDate: string | null;
  issuer: string | null;
  notes: string | null;
  createdAt: string;
};

// ─── Boat ─────────────────────────────────────────────────────────────────────

export type Boat = {
  id: string;
  name: string;
  identifier: string | null;
  registrationNumber: string | null;
  brandModel: string | null;
  buildYear: number | null;
  shipyard: string | null;
  propulsion: string | null;
  boatType: string | null;
  engineNotes: string | null;
  notes: string | null;
  flag: string | null;
  dimensions: BoatDimensions | null;
  tanks: BoatTank[] | null;
  identifiers: BoatIdentifiers | null;
  ownerIds: string[];
  ownerNames: string[];
};

// ─── Boat System ──────────────────────────────────────────────────────────────

export type BoatSystem = {
  id: string;
  boatId: string;
  systemId: string;
  systemCode: string;
  nameEs: string;
  nameEn: string;
  notes: string | null;
  inventoryCount?: number;
};

export type BoatComponent = {
  id: string;
  boatId: string;
  boatSystemId: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  notes: string | null;
};

// ─── Attachment ───────────────────────────────────────────────────────────────

export type TaskAttachment = {
  id: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  documentCategory: "photo" | "file";
  createdAt: string;
  signedUrl: string | null;
};

// ─── Maintenance Task ─────────────────────────────────────────────────────────

export type MaintenanceTask = {
  id: string;
  templateId?: string | null;
  boatId: string;
  boatSystemId: string | null;
  boatComponentId: string | null;
  haulOutId: string | null;
  title: string;
  description: string | null;
  kind: MaintenanceKind;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  doneDate: string | null;
  responsible: string | null;
  performedBy: string | null;
  engineHours: number | null;
  cost: number | null;
  notes: string | null;
  updatedAt?: string;
  systemName: string;
  boatName: string;
  hasPhoto?: boolean;
  hasFile?: boolean;
};

// ─── Preventive Plan ─────────────────────────────────────────────────────────

export type PreventiveTask = {
  id: string;
  templateId?: string | null;
  boatId: string;
  boatSystemId: string | null;
  title: string;
  description: string | null;
  intervalDays: number | null;
  intervalHours: number | null;
  nextDueDate: string | null;
  lastDoneAt: string | null;
  status: TaskStatus;
  responsible: string | null;
  notes: string | null;
  systemName: string;
  boatName: string;
  state: "upcoming" | "overdue" | "done";
  rule: string;
};

// ─── Haul-out ─────────────────────────────────────────────────────────────────

export type HaulOut = {
  id: string;
  boatId: string;
  boatName: string;
  name: string;
  plannedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  status: HaulOutStatus;
  shipyardId: string | null;
  shipyardName: string | null;
  location: string | null;
  responsible: string | null;
  estimatedCost: number | null;
  paidToDate: number | null;
  finalCost: number | null;
  notes: string | null;
};

export type HaulOutItem = {
  id: string;
  haulOutId: string;
  boatSystemId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  done: boolean;
  responsible: string | null;
  cost: number | null;
  notes: string | null;
  systemName: string;
};

// ─── Observation ─────────────────────────────────────────────────────────────

export type Observation = {
  id: string;
  boatId: string;
  boatName: string;
  boatSystemId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: ObservationStatus;
  observedAt: string | null;
  reportedBy: string | null;
  notes: string | null;
  systemName: string;
};

// ─── Future Action ───────────────────────────────────────────────────────────

export type FutureAction = {
  id: string;
  boatId: string;
  boatName: string;
  boatSystemId: string | null;
  haulOutId: string | null;
  observationId: string | null;
  kind: FutureActionKind;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  targetDate: string | null;
  responsible: string | null;
  notes: string | null;
  systemName: string;
};

// ─── Future Purchase ─────────────────────────────────────────────────────────

export type FuturePurchase = {
  id: string;
  boatId: string;
  boatName: string;
  boatSystemId: string | null;
  observationId: string | null;
  articleName: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  priority: Priority;
  status: PurchaseStatus;
  supplier: string | null;
  estimatedCost: number | null;
  targetDate: string | null;
  notes: string | null;
  systemName: string;
};

// ─── Inventory Catalog ───────────────────────────────────────────────────────

export type InventoryCatalogItem = {
  id: string;
  systemCode: string;
  nameEs: string;
  nameEn: string;
  category: InventoryCategory;
  manufacturer: string | null;
  model: string | null;
  description: string | null;
  sortOrder: number;
};

export type BoatInventoryCatalogEntry = {
  id: string;
  boatId: string;
  catalogId: string;
  inventoryItemId: string | null;
  notes: string | null;
};

// ─── Inventory ───────────────────────────────────────────────────────────────

export type InventoryCategory =
  | "spare_part"
  | "main_equipment"
  | "electronics"
  | "safety"
  | "sails_rigging"
  | "anchoring"
  | "tools"
  | "documentation"
  | "accessories"
  | "consumable"
  | "other";

export type InventoryStatus = "on_board" | "off_board" | "in_repair" | "disposed";

export type InventoryItem = {
  id: string;
  boatId: string;
  boatName: string;
  boatSystemId: string | null;
  boatComponentId: string | null;
  name: string;
  category: InventoryCategory;
  reference: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  description: string | null;
  quantity: number;
  unit: string | null;
  stock: number;
  minimumStock: number | null;
  status: InventoryStatus;
  location: string | null;
  supplier: string | null;
  purchaseDate: string | null;
  acquisitionCost: number | null;
  cost: number | null;
  notes: string | null;
  systemName: string;
  system: string;
  minimum: number;
};

// ─── Hour Counter / Log ───────────────────────────────────────────────────────

export type HourCounter = {
  id: string;
  boatId: string;
  boatName: string;
  boatComponentId: string | null;
  name: string;
  currentHours: number;
  notes: string | null;
};

export type HourLog = {
  id: string;
  boatId: string;
  boatName: string;
  hourCounterId: string;
  counterName: string;
  loggedAt: string;
  hours: number;
  notes: string | null;
  loggedBy: string | null;
};

// ─── Fuel Log ────────────────────────────────────────────────────────────────

export type FuelLog = {
  id: string;
  boatId: string;
  boatName: string;
  fuelledAt: string;
  fuelType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number | null;
  totalCost: number | null;
  supplier: string | null;
  engineHoursAtFuelling: number | null;
  notes: string | null;
};

// ─── Marina ───────────────────────────────────────────────────────────────────

export type Marina = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  vhfChannel: string | null;
  mooringType: string | null;
  hasWater: boolean;
  hasElectricity: boolean;
  hasWifi: boolean;
  hasShowers: boolean;
  hasSecurity: boolean;
  rating: number | null;
  notes: string | null;
  infoDate: string | null;
  source: string | null;
  createdBy: string | null;
};

// ─── Shipyard (Varadero) ──────────────────────────────────────────────────────

export type Shipyard = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  vhfChannel: string | null;
  liftType: string | null;
  liftCapacityTons: number | null;
  maxLengthM: number | null;
  maxBeamM: number | null;
  maxDraftM: number | null;
  hasWater: boolean;
  hasElectricity: boolean;
  hasWifi: boolean;
  hasShowers: boolean;
  hasSecurity: boolean;
  services: string | null;
  liftInOutPrice: number | null;
  pressureWashPrice: number | null;
  dailyStoragePrice: number | null;
  monthlyStoragePrice: number | null;
  annualStoragePrice: number | null;
  currency: string | null;
  vatPercent: number | null;
  rating: number | null;
  notes: string | null;
  infoDate: string | null;
  source: string | null;
};

// ─── Legacy summary types (kept for dashboard compatibility) ──────────────────

export type BoatSummary = {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  owners: string[];
  nextHaulOut: string | null;
  openTasks: number;
};

export type AppData = {
  boats: BoatSummary[];
  maintenanceTasks: MaintenanceTask[];
  preventiveTasks: PreventiveTask[];
  inventoryItems: InventoryItem[];
  source: "demo" | "supabase";
  error: string | null;
};

export type AdminBoatOption = {
  id: string;
  name: string;
  type: string;
};

export type AdminUserAssignment = {
  membershipId: string;
  boatId: string;
  boatName: string;
  role: AppRole;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  preferredLanguage: "es" | "en";
  isSuperuser: boolean;
  inviteStatus: "accepted" | "pending" | "not_invited";
  invitedAt: string | null;
  acceptedAt: string | null;
  lastSignInAt: string | null;
  assignments: AdminUserAssignment[];
};
