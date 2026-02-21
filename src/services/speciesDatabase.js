/**
 * Species Database Service — ProFish
 *
 * 500+ species at launch, expanding to 2,000+ in Phase 2.
 * Source: FishBase (open, CC-BY-NC) + Wikipedia for localized names.
 *
 * Species data includes:
 *   - Common name (localized in 24 languages)
 *   - Scientific name
 *   - Family
 *   - Habitat (fresh/salt/brackish)
 *   - Typical size range
 *   - Regions found
 *   - AI recognition model ID
 */

// Starter species — will be expanded significantly
const SPECIES_DB = [
  // ── Freshwater — Americas ─────────────────────────
  {
    id: 'largemouth_bass',
    scientific: 'Micropterus salmoides',
    family: 'Centrarchidae',
    habitat: 'freshwater',
    regions: ['NA', 'SA', 'EU', 'AF', 'AS'],
  },
  {
    id: 'smallmouth_bass',
    scientific: 'Micropterus dolomieu',
    family: 'Centrarchidae',
    habitat: 'freshwater',
    regions: ['NA'],
  },
  {
    id: 'striped_bass',
    scientific: 'Morone saxatilis',
    family: 'Moronidae',
    habitat: 'brackish',
    regions: ['NA'],
  },
  {
    id: 'rainbow_trout',
    scientific: 'Oncorhynchus mykiss',
    family: 'Salmonidae',
    habitat: 'freshwater',
    regions: ['NA', 'EU', 'AS', 'OC', 'SA'],
  },
  {
    id: 'brown_trout',
    scientific: 'Salmo trutta',
    family: 'Salmonidae',
    habitat: 'freshwater',
    regions: ['NA', 'EU', 'AS', 'OC', 'AF'],
  },
  {
    id: 'channel_catfish',
    scientific: 'Ictalurus punctatus',
    family: 'Ictaluridae',
    habitat: 'freshwater',
    regions: ['NA'],
  },
  {
    id: 'walleye',
    scientific: 'Sander vitreus',
    family: 'Percidae',
    habitat: 'freshwater',
    regions: ['NA'],
  },
  {
    id: 'northern_pike',
    scientific: 'Esox lucius',
    family: 'Esocidae',
    habitat: 'freshwater',
    regions: ['NA', 'EU', 'AS'],
  },
  {
    id: 'bluegill',
    scientific: 'Lepomis macrochirus',
    family: 'Centrarchidae',
    habitat: 'freshwater',
    regions: ['NA'],
  },
  {
    id: 'crappie',
    scientific: 'Pomoxis spp.',
    family: 'Centrarchidae',
    habitat: 'freshwater',
    regions: ['NA'],
  },
  {
    id: 'tucunare',
    scientific: 'Cichla spp.',
    family: 'Cichlidae',
    habitat: 'freshwater',
    regions: ['SA'],
  },
  {
    id: 'dourado',
    scientific: 'Salminus brasiliensis',
    family: 'Bryconidae',
    habitat: 'freshwater',
    regions: ['SA'],
  },
  {
    id: 'pirarucu',
    scientific: 'Arapaima gigas',
    family: 'Arapaimidae',
    habitat: 'freshwater',
    regions: ['SA'],
  },

  // ── Freshwater — Europe ────────────────────────────
  {
    id: 'european_perch',
    scientific: 'Perca fluviatilis',
    family: 'Percidae',
    habitat: 'freshwater',
    regions: ['EU', 'AS'],
  },
  {
    id: 'zander',
    scientific: 'Sander lucioperca',
    family: 'Percidae',
    habitat: 'freshwater',
    regions: ['EU', 'AS'],
  },
  {
    id: 'common_carp',
    scientific: 'Cyprinus carpio',
    family: 'Cyprinidae',
    habitat: 'freshwater',
    regions: ['EU', 'AS', 'NA', 'OC'],
  },
  {
    id: 'atlantic_salmon',
    scientific: 'Salmo salar',
    family: 'Salmonidae',
    habitat: 'brackish',
    regions: ['NA', 'EU'],
  },
  {
    id: 'grayling',
    scientific: 'Thymallus thymallus',
    family: 'Salmonidae',
    habitat: 'freshwater',
    regions: ['EU'],
  },

  // ── Freshwater — Asia ──────────────────────────────
  {
    id: 'mekong_giant_catfish',
    scientific: 'Pangasianodon gigas',
    family: 'Pangasiidae',
    habitat: 'freshwater',
    regions: ['AS'],
  },
  {
    id: 'mahseer',
    scientific: 'Tor spp.',
    family: 'Cyprinidae',
    habitat: 'freshwater',
    regions: ['AS'],
  },
  {
    id: 'snakehead',
    scientific: 'Channa spp.',
    family: 'Channidae',
    habitat: 'freshwater',
    regions: ['AS', 'AF'],
  },
  {
    id: 'barramundi',
    scientific: 'Lates calcarifer',
    family: 'Latidae',
    habitat: 'brackish',
    regions: ['AS', 'OC'],
  },

  // ── Saltwater — Global ─────────────────────────────
  {
    id: 'bluefin_tuna',
    scientific: 'Thunnus thynnus',
    family: 'Scombridae',
    habitat: 'saltwater',
    regions: ['NA', 'EU', 'AS'],
  },
  {
    id: 'yellowfin_tuna',
    scientific: 'Thunnus albacares',
    family: 'Scombridae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'AS', 'OC'],
  },
  {
    id: 'sailfish',
    scientific: 'Istiophorus platypterus',
    family: 'Istiophoridae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'AS'],
  },
  {
    id: 'blue_marlin',
    scientific: 'Makaira nigricans',
    family: 'Istiophoridae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'AS'],
  },
  {
    id: 'mahi_mahi',
    scientific: 'Coryphaena hippurus',
    family: 'Coryphaenidae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'AS', 'OC'],
  },
  {
    id: 'giant_trevally',
    scientific: 'Caranx ignobilis',
    family: 'Carangidae',
    habitat: 'saltwater',
    regions: ['AF', 'AS', 'OC'],
  },
  {
    id: 'kingfish',
    scientific: 'Seriola lalandi',
    family: 'Carangidae',
    habitat: 'saltwater',
    regions: ['OC', 'AF', 'SA'],
  },
  {
    id: 'red_snapper',
    scientific: 'Lutjanus campechanus',
    family: 'Lutjanidae',
    habitat: 'saltwater',
    regions: ['NA'],
  },
  {
    id: 'grouper',
    scientific: 'Epinephelus spp.',
    family: 'Serranidae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'AS', 'OC'],
  },
  {
    id: 'tarpon',
    scientific: 'Megalops atlanticus',
    family: 'Megalopidae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF'],
  },
  {
    id: 'bonefish',
    scientific: 'Albula vulpes',
    family: 'Albulidae',
    habitat: 'saltwater',
    regions: ['NA', 'SA'],
  },
  {
    id: 'red_drum',
    scientific: 'Sciaenops ocellatus',
    family: 'Sciaenidae',
    habitat: 'brackish',
    regions: ['NA'],
  },
  {
    id: 'snook',
    scientific: 'Centropomus undecimalis',
    family: 'Centropomidae',
    habitat: 'brackish',
    regions: ['NA', 'SA'],
  },

  // ── Saltwater — Middle East ────────────────────────
  {
    id: 'hammour',
    scientific: 'Epinephelus coioides',
    family: 'Serranidae',
    habitat: 'saltwater',
    regions: ['ME', 'AS'],
  },
  {
    id: 'cobia',
    scientific: 'Rachycentron canadum',
    family: 'Rachycentridae',
    habitat: 'saltwater',
    regions: ['NA', 'ME', 'AS', 'OC'],
  },
  {
    id: 'barracuda',
    scientific: 'Sphyraena barracuda',
    family: 'Sphyraenidae',
    habitat: 'saltwater',
    regions: ['NA', 'SA', 'AF', 'ME', 'AS'],
  },
  {
    id: 'queenfish',
    scientific: 'Scomberoides commersonnianus',
    family: 'Carangidae',
    habitat: 'saltwater',
    regions: ['ME', 'AS', 'AF', 'OC'],
  },

  // ── Saltwater — Scandinavia/Europe ─────────────────
  {
    id: 'atlantic_cod',
    scientific: 'Gadus morhua',
    family: 'Gadidae',
    habitat: 'saltwater',
    regions: ['NA', 'EU'],
  },
  {
    id: 'sea_trout',
    scientific: 'Salmo trutta trutta',
    family: 'Salmonidae',
    habitat: 'brackish',
    regions: ['EU'],
  },
  {
    id: 'european_sea_bass',
    scientific: 'Dicentrarchus labrax',
    family: 'Moronidae',
    habitat: 'saltwater',
    regions: ['EU', 'AF'],
  },
  {
    id: 'halibut',
    scientific: 'Hippoglossus hippoglossus',
    family: 'Pleuronectidae',
    habitat: 'saltwater',
    regions: ['NA', 'EU'],
  },
];

const speciesDatabase = {
  /**
   * Get all species
   */
  getAll() {
    return SPECIES_DB;
  },

  /**
   * Search by name or scientific name
   */
  search(query) {
    const q = query.toLowerCase();
    return SPECIES_DB.filter(
      s =>
        s.id.replace(/_/g, ' ').includes(q) ||
        s.scientific.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q),
    );
  },

  /**
   * Get species by ID
   */
  getById(id) {
    return SPECIES_DB.find(s => s.id === id) || null;
  },

  /**
   * Get species filtered by region
   */
  getByRegion(region) {
    return SPECIES_DB.filter(s => s.regions.includes(region));
  },

  /**
   * Get species by habitat type
   */
  getByHabitat(habitat) {
    return SPECIES_DB.filter(s => s.habitat === habitat);
  },

  /**
   * Get species count
   */
  getCount() {
    return SPECIES_DB.length;
  },
};

export default speciesDatabase;
