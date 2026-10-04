export interface AvatarPreset {
  id: string;
  name: string;
  category: 'people' | 'plants' | 'animals' | 'nature';
  url: string;
}

// Generador de Avatares SVG limpios, independientes y vectoriales
// Cero peticiones de red externas, 100% de fiabilidad en producción, Netlify, GitHub y offline
function makeSvgUrl(svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

export const BOTANICAL_AVATAR_PRESETS: AvatarPreset[] = [
  // --- PERSONAJES E ILUSTRACIONES HUMANAS (18) ---
  {
    id: 'char_botanist_cap',
    name: 'Chico Botánico con Gorra',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#e8f5e9"/>
      <circle cx="50" cy="50" r="24" fill="#ffd1b3"/>
      <path d="M 26 50 Q 50 68 74 50 Q 74 85 26 85 Z" fill="#006b5e"/>
      <path d="M 28 42 Q 50 22 72 42 Z" fill="#2d3748"/>
      <path d="M 24 38 Q 50 20 76 38 L 86 38 Q 80 30 65 24 L 35 24 Q 20 30 14 38 Z" fill="#006b5e"/>
      <circle cx="42" cy="48" r="2.5" fill="#2d3748"/>
      <circle cx="58" cy="48" r="2.5" fill="#2d3748"/>
      <path d="M 44 56 Q 50 60 56 56" stroke="#2d3748" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="34" cy="52" r="3" fill="#ffb38a" opacity="0.6"/>
      <circle cx="66" cy="52" r="3" fill="#ffb38a" opacity="0.6"/>
    `)
  },
  {
    id: 'char_curly_glasses',
    name: 'Chica con Gafas y Pelo Rizado',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Pelo rizado frondoso -->
      <circle cx="32" cy="38" r="14" fill="#3e2723"/>
      <circle cx="68" cy="38" r="14" fill="#3e2723"/>
      <circle cx="50" cy="28" r="15" fill="#3e2723"/>
      <circle cx="35" cy="52" r="12" fill="#3e2723"/>
      <circle cx="65" cy="52" r="12" fill="#3e2723"/>
      <circle cx="50" cy="52" r="22" fill="#8d5b4c"/>
      <path d="M 28 54 Q 50 72 72 54 Q 72 88 28 88 Z" fill="#e07a5f"/>
      <circle cx="42" cy="50" r="7" stroke="#2d3748" stroke-width="2" fill="none"/>
      <circle cx="58" cy="50" r="7" stroke="#2d3748" stroke-width="2" fill="none"/>
      <line x1="49" y1="50" x2="51" y2="50" stroke="#2d3748" stroke-width="2"/>
      <circle cx="42" cy="50" r="2" fill="#2d3748"/>
      <circle cx="58" cy="50" r="2" fill="#2d3748"/>
      <path d="M 44 60 Q 50 64 56 60" stroke="#2d3748" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_bald_gardener',
    name: 'Jardinero Sonriente Calvo',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <circle cx="50" cy="46" r="23" fill="#d29979"/>
      <path d="M 26 56 Q 50 76 74 56 Q 74 88 26 88 Z" fill="#2bb19e"/>
      <circle cx="42" cy="45" r="2.5" fill="#1f2937"/>
      <circle cx="58" cy="45" r="2.5" fill="#1f2937"/>
      <path d="M 37 38 Q 42 36 47 38" stroke="#1f2937" stroke-width="1.8" fill="none"/>
      <path d="M 53 38 Q 58 36 63 38" stroke="#1f2937" stroke-width="1.8" fill="none"/>
      <path d="M 41 54 Q 50 63 59 54" stroke="#1f2937" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="50" r="3.5" fill="#c08060" opacity="0.5"/>
      <circle cx="64" cy="50" r="3.5" fill="#c08060" opacity="0.5"/>
      <!-- Barba corta recortada -->
      <path d="M 35 52 Q 50 72 65 52 Q 50 66 35 52 Z" fill="#6b7280" opacity="0.3"/>
    `)
  },
  {
    id: 'char_longhair_leaves',
    name: 'Chica con Corona de Hojas',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fef3c7"/>
      <!-- Cabello largo castaño -->
      <path d="M 22 45 Q 50 18 78 45 L 82 82 Q 50 86 18 82 Z" fill="#5c3a21"/>
      <circle cx="50" cy="48" r="21" fill="#fcd9bd"/>
      <path d="M 28 54 Q 50 74 72 54 Q 72 88 28 88 Z" fill="#3b7a57"/>
      <circle cx="43" cy="46" r="2.5" fill="#2d3748"/>
      <circle cx="57" cy="46" r="2.5" fill="#2d3748"/>
      <path d="M 44 54 Q 50 58 56 54" stroke="#c25e5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Corona de hojas -->
      <circle cx="34" cy="30" r="4" fill="#2bb19e"/>
      <circle cx="44" cy="27" r="4" fill="#10b981"/>
      <circle cx="56" cy="27" r="4" fill="#2bb19e"/>
      <circle cx="66" cy="30" r="4" fill="#10b981"/>
    `)
  },
  {
    id: 'char_afro_green',
    name: 'Chico con Cabello Afro',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#e0f2fe"/>
      <!-- Afro esférico -->
      <circle cx="50" cy="42" r="30" fill="#1c1917"/>
      <circle cx="50" cy="49" r="21" fill="#5c3826"/>
      <path d="M 28 56 Q 50 74 72 56 Q 72 88 28 88 Z" fill="#15803d"/>
      <circle cx="43" cy="47" r="2.5" fill="#f8fafc"/>
      <circle cx="57" cy="47" r="2.5" fill="#f8fafc"/>
      <circle cx="43" cy="47" r="1.5" fill="#020617"/>
      <circle cx="57" cy="47" r="1.5" fill="#020617"/>
      <path d="M 43 57 Q 50 63 57 57" stroke="#f8fafc" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_blonde_bun',
    name: 'Chica con Moño Alto',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fef9c3"/>
      <!-- Moño alto -->
      <circle cx="50" cy="22" r="12" fill="#d97706"/>
      <circle cx="50" cy="48" r="21" fill="#fed7aa"/>
      <!-- Flequillo -->
      <path d="M 30 38 Q 50 25 70 38 Q 50 32 30 38 Z" fill="#d97706"/>
      <path d="M 28 54 Q 50 72 72 54 Q 72 88 28 88 Z" fill="#0284c7"/>
      <circle cx="43" cy="46" r="2" fill="#1e293b"/>
      <circle cx="57" cy="46" r="2" fill="#1e293b"/>
      <path d="M 44 54 Q 50 58 56 54" stroke="#e11d48" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="49" r="3" fill="#f43f5e" opacity="0.3"/>
      <circle cx="64" cy="49" r="3" fill="#f43f5e" opacity="0.3"/>
    `)
  },
  {
    id: 'char_shaved_sideburns',
    name: 'Chico con Pelo Rapado y Barba',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f1f5f9"/>
      <circle cx="50" cy="46" r="22" fill="#e0a98b"/>
      <!-- Pelo muy corto / rapado superior -->
      <path d="M 29 42 Q 50 24 71 42 Q 50 30 29 42 Z" fill="#334155"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#475569"/>
      <!-- Barba completa elegante -->
      <path d="M 34 48 Q 50 75 66 48 Q 50 67 34 48 Z" fill="#334155"/>
      <circle cx="43" cy="44" r="2.5" fill="#0f172a"/>
      <circle cx="57" cy="44" r="2.5" fill="#0f172a"/>
      <path d="M 44 54 Q 50 58 56 54" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_braids_warm',
    name: 'Chica con Trenzas',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fdf4ff"/>
      <!-- Trenzas laterales -->
      <path d="M 25 35 Q 18 55 22 75" stroke="#18181b" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M 75 35 Q 82 55 78 75" stroke="#18181b" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="47" r="22" fill="#784428"/>
      <path d="M 28 38 Q 50 24 72 38 Z" fill="#18181b"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#9333ea"/>
      <circle cx="42" cy="46" r="2.5" fill="#f8fafc"/>
      <circle cx="58" cy="46" r="2.5" fill="#f8fafc"/>
      <circle cx="42" cy="46" r="1.5" fill="#09090b"/>
      <circle cx="58" cy="46" r="1.5" fill="#09090b"/>
      <path d="M 44 55 Q 50 60 56 55" stroke="#fbcfe8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_senior_silver',
    name: 'Persona Sabia con Pelo Canoso',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Cabello plateado ondulado -->
      <path d="M 25 45 Q 50 20 75 45 Q 78 60 74 65 Q 50 55 26 65 Z" fill="#cbd5e1"/>
      <circle cx="50" cy="48" r="21" fill="#fbd5b5"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#065f46"/>
      <!-- Gafas de lectura -->
      <circle cx="43" cy="47" r="5" stroke="#64748b" stroke-width="1.8" fill="none"/>
      <circle cx="57" cy="47" r="5" stroke="#64748b" stroke-width="1.8" fill="none"/>
      <line x1="48" y1="47" x2="52" y2="47" stroke="#64748b" stroke-width="1.8"/>
      <circle cx="43" cy="47" r="1.8" fill="#1e293b"/>
      <circle cx="57" cy="47" r="1.8" fill="#1e293b"/>
      <path d="M 45 57 Q 50 61 55 57" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_safari_hat',
    name: 'Explorador con Sombrero',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <circle cx="50" cy="51" r="20" fill="#d49f7d"/>
      <path d="M 26 58 Q 50 76 74 58 Q 74 88 26 88 Z" fill="#854d0e"/>
      <circle cx="43" cy="50" r="2.5" fill="#1c1917"/>
      <circle cx="57" cy="50" r="2.5" fill="#1c1917"/>
      <path d="M 44 58 Q 50 62 56 58" stroke="#1c1917" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Sombrero safari botánico -->
      <ellipse cx="50" cy="38" rx="36" ry="9" fill="#ca8a04"/>
      <path d="M 28 38 Q 30 20 50 20 Q 70 20 72 38 Z" fill="#eab308"/>
      <rect x="33" y="34" width="34" height="4" fill="#713f12"/>
    `)
  },
  {
    id: 'char_ponytail_visor',
    name: 'Chica Botánica con Visera',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfeff"/>
      <circle cx="50" cy="49" r="21" fill="#fce7d2"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#0891b2"/>
      <!-- Visera deportiva -->
      <path d="M 24 38 Q 50 30 76 38 L 84 40 Q 50 33 16 40 Z" fill="#0e7490"/>
      <path d="M 27 38 Q 50 26 73 38 Z" fill="#155e75"/>
      <circle cx="43" cy="48" r="2.5" fill="#164e63"/>
      <circle cx="57" cy="48" r="2.5" fill="#164e63"/>
      <path d="M 44 56 Q 50 61 56 56" stroke="#e11d48" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_wavy_olive',
    name: 'Persona con Pelo Ondulado',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f7fee7"/>
      <!-- Cabello oscuro ondulado -->
      <path d="M 24 45 C 24 25 76 25 76 45 C 80 60 72 75 72 75 Q 50 65 28 75 Z" fill="#1e293b"/>
      <circle cx="50" cy="49" r="21" fill="#a16244"/>
      <path d="M 28 56 Q 50 74 72 56 Q 72 88 28 88 Z" fill="#4d7c0f"/>
      <circle cx="42" cy="47" r="2.5" fill="#f8fafc"/>
      <circle cx="58" cy="47" r="2.5" fill="#f8fafc"/>
      <circle cx="42" cy="47" r="1.5" fill="#0f172a"/>
      <circle cx="58" cy="47" r="1.5" fill="#0f172a"/>
      <path d="M 44 56 Q 50 61 56 56" stroke="#f8fafc" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_bob_earring',
    name: 'Chica con Corte Bob',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fff1f2"/>
      <!-- Corte bob liso -->
      <path d="M 25 45 C 25 25 75 25 75 45 L 75 62 L 67 60 L 67 45 C 67 35 33 35 33 45 L 33 60 L 25 62 Z" fill="#1c1917"/>
      <circle cx="50" cy="48" r="21" fill="#fed7aa"/>
      <path d="M 28 56 Q 50 74 72 56 Q 72 88 28 88 Z" fill="#be123c"/>
      <!-- Pendiente de hoja -->
      <path d="M 72 50 Q 75 56 72 60 Q 69 56 72 50 Z" fill="#10b981"/>
      <circle cx="43" cy="46" r="2" fill="#1c1917"/>
      <circle cx="57" cy="46" r="2" fill="#1c1917"/>
      <path d="M 44 54 Q 50 58 56 54" stroke="#be123c" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_beanie_gardener',
    name: 'Chico con Gorro Beanie',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#eff6ff"/>
      <circle cx="50" cy="51" r="21" fill="#fcd9bd"/>
      <!-- Gorro beanie amarillo ocre -->
      <path d="M 28 42 C 28 22 72 22 72 42 Z" fill="#d97706"/>
      <rect x="26" y="38" width="48" height="6" rx="3" fill="#b45309"/>
      <path d="M 28 58 Q 50 76 72 58 Q 72 88 28 88 Z" fill="#1d4ed8"/>
      <circle cx="43" cy="49" r="2.5" fill="#1e293b"/>
      <circle cx="57" cy="49" r="2.5" fill="#1e293b"/>
      <path d="M 44 57 Q 50 62 56 57" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_freckles_dungarees',
    name: 'Chica con Pecas y Peto',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdfa"/>
      <!-- Cabello cobrizo -->
      <path d="M 24 45 Q 50 20 76 45 L 78 70 Q 50 78 22 70 Z" fill="#c2410c"/>
      <circle cx="50" cy="48" r="21" fill="#ffedd5"/>
      <!-- Peto de jardinera -->
      <path d="M 28 56 Q 50 74 72 56 Q 72 88 28 88 Z" fill="#0f766e"/>
      <circle cx="43" cy="46" r="2.5" fill="#1e293b"/>
      <circle cx="57" cy="46" r="2.5" fill="#1e293b"/>
      <!-- Pecas tiernas -->
      <circle cx="39" cy="50" r="1" fill="#ea580c"/>
      <circle cx="41" cy="52" r="1" fill="#ea580c"/>
      <circle cx="59" cy="50" r="1" fill="#ea580c"/>
      <circle cx="61" cy="52" r="1" fill="#ea580c"/>
      <path d="M 44 55 Q 50 60 56 55" stroke="#ea580c" stroke-width="2" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'char_student_plant',
    name: 'Estudiante con Planta',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#faf5ff"/>
      <circle cx="50" cy="46" r="22" fill="#e2a17f"/>
      <path d="M 28 40 Q 50 25 72 40 Z" fill="#312e81"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#6366f1"/>
      <circle cx="43" cy="45" r="2.5" fill="#1e1b4b"/>
      <circle cx="57" cy="45" r="2.5" fill="#1e1b4b"/>
      <path d="M 44 54 Q 50 59 56 54" stroke="#1e1b4b" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Macetita pequeña en primer plano -->
      <path d="M 45 74 L 55 74 L 53 84 L 47 84 Z" fill="#ea580c"/>
      <path d="M 50 74 Q 53 66 50 66 Q 47 66 50 74 Z" fill="#22c55e"/>
    `)
  },
  {
    id: 'char_nature_spirit',
    name: 'Espíritu de la Naturaleza',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#e6f4f1"/>
      <circle cx="50" cy="50" r="32" fill="#a7f3d0" opacity="0.4"/>
      <circle cx="50" cy="48" r="21" fill="#d1fae5"/>
      <!-- Cabello de hojas verdes -->
      <path d="M 28 35 Q 38 18 50 26 Q 62 18 72 35 Q 60 30 50 34 Q 40 30 28 35 Z" fill="#10b981"/>
      <circle cx="43" cy="47" r="2.5" fill="#065f46"/>
      <circle cx="57" cy="47" r="2.5" fill="#065f46"/>
      <path d="M 44 55 Q 50 60 56 55" stroke="#059669" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="50" r="3" fill="#34d399" opacity="0.6"/>
      <circle cx="64" cy="50" r="3" fill="#34d399" opacity="0.6"/>
      <path d="M 28 58 Q 50 76 72 58 Q 72 88 28 88 Z" fill="#047857"/>
    `)
  },
  {
    id: 'char_botanic_professor',
    name: 'Profesor de Botánica',
    category: 'people',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fffbeb"/>
      <circle cx="50" cy="48" r="22" fill="#edd0b7"/>
      <!-- Cabello blanco y bigote señorial -->
      <path d="M 26 44 C 26 24 74 24 74 44 Z" fill="#e2e8f0"/>
      <path d="M 26 56 Q 50 74 74 56 Q 74 88 26 88 Z" fill="#78350f"/>
      <circle cx="43" cy="45" r="2" fill="#1e293b"/>
      <circle cx="57" cy="45" r="2" fill="#1e293b"/>
      <!-- Bigote blanco distinguido -->
      <path d="M 42 53 Q 50 51 58 53 Q 50 58 42 53 Z" fill="#e2e8f0"/>
      <circle cx="42" cy="45" r="5" stroke="#b45309" stroke-width="1.5" fill="none"/>
      <circle cx="58" cy="45" r="5" stroke="#b45309" stroke-width="1.5" fill="none"/>
      <line x1="47" y1="45" x2="53" y2="45" stroke="#b45309" stroke-width="1.5"/>
    `)
  },

  // --- PLANTAS BOTÁNICAS (16) ---
  {
    id: 'plant_monstera',
    name: 'Monstera Deliciosa',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <path d="M 50 85 Q 50 50 50 20 C 70 20 85 45 75 75 C 65 85 50 85 50 85 Z" fill="#047857"/>
      <path d="M 50 85 Q 50 50 50 20 C 30 20 15 45 25 75 C 35 85 50 85 50 85 Z" fill="#059669"/>
      <!-- Fenestraciones (agujeros de monstera) -->
      <ellipse cx="62" cy="42" rx="4" ry="10" transform="rotate(30 62 42)" fill="#ecfdf5"/>
      <ellipse cx="65" cy="60" rx="3" ry="8" transform="rotate(45 65 60)" fill="#ecfdf5"/>
      <ellipse cx="38" cy="42" rx="4" ry="10" transform="rotate(-30 38 42)" fill="#ecfdf5"/>
      <ellipse cx="35" cy="60" rx="3" ry="8" transform="rotate(-45 35 60)" fill="#ecfdf5"/>
      <line x1="50" y1="20" x2="50" y2="85" stroke="#064e3b" stroke-width="2.5"/>
    `)
  },
  {
    id: 'plant_bonsai',
    name: 'Bonsái Zen Milenario',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Maceta cerámica zen -->
      <rect x="25" y="74" width="50" height="12" rx="4" fill="#334155"/>
      <line x1="28" y1="86" x2="32" y2="90" stroke="#1e293b" stroke-width="3"/>
      <line x1="72" y1="86" x2="68" y2="90" stroke="#1e293b" stroke-width="3"/>
      <!-- Tronco retorcido -->
      <path d="M 48 74 Q 45 60 55 52 Q 62 45 52 35" stroke="#78350f" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M 53 54 Q 38 48 35 40" stroke="#78350f" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <!-- Copas de follaje estilo nube -->
      <ellipse cx="52" cy="30" rx="20" ry="11" fill="#15803d"/>
      <ellipse cx="32" cy="38" rx="14" ry="8" fill="#16a34a"/>
      <ellipse cx="68" cy="42" rx="12" ry="7" fill="#15803d"/>
    `)
  },
  {
    id: 'plant_echeveria',
    name: 'Echeveria Elegans',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0f9ff"/>
      <!-- Pétalos suculenta en roseta concéntrica -->
      <ellipse cx="50" cy="50" rx="40" ry="14" fill="#0284c7" opacity="0.3"/>
      <ellipse cx="50" cy="50" rx="14" ry="40" fill="#0284c7" opacity="0.3"/>
      <ellipse cx="50" cy="50" rx="35" ry="12" transform="rotate(45 50 50)" fill="#38bdf8" opacity="0.5"/>
      <ellipse cx="50" cy="50" rx="35" ry="12" transform="rotate(-45 50 50)" fill="#38bdf8" opacity="0.5"/>
      <circle cx="50" cy="50" r="22" fill="#0ea5e9"/>
      <circle cx="50" cy="50" r="14" fill="#7dd3fc"/>
      <circle cx="50" cy="50" r="6" fill="#f0f9ff"/>
    `)
  },
  {
    id: 'plant_orchid',
    name: 'Orquídea Blanca Phalaenopsis',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#faf5ff"/>
      <path d="M 50 85 Q 52 50 50 25" stroke="#15803d" stroke-width="3" fill="none"/>
      <!-- Pétalos orquídea níveos -->
      <ellipse cx="32" cy="42" rx="15" ry="12" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5"/>
      <ellipse cx="68" cy="42" rx="15" ry="12" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5"/>
      <ellipse cx="50" cy="30" rx="12" ry="15" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5"/>
      <ellipse cx="38" cy="58" rx="12" ry="10" fill="#fdf4ff" stroke="#e9d5ff" stroke-width="1.5"/>
      <ellipse cx="62" cy="58" rx="12" ry="10" fill="#fdf4ff" stroke="#e9d5ff" stroke-width="1.5"/>
      <!-- Labelo central con toques violeta y oro -->
      <circle cx="50" cy="48" r="6" fill="#c026d3"/>
      <circle cx="50" cy="48" r="3" fill="#eab308"/>
    `)
  },
  {
    id: 'plant_sansevieria',
    name: 'Sansevieria Espada de San Jorge',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <!-- Maceta terracota -->
      <path d="M 32 68 L 68 68 L 63 88 L 37 88 Z" fill="#c2410c"/>
      <rect x="30" y="65" width="40" height="5" rx="2" fill="#9a3412"/>
      <!-- Hojas erectas con bordes amarillos -->
      <path d="M 50 68 Q 50 35 50 12 Q 47 35 50 68" stroke="#ca8a04" stroke-width="14" fill="#15803d" stroke-linecap="round"/>
      <path d="M 39 68 Q 36 45 42 24 Q 45 45 39 68" stroke="#ca8a04" stroke-width="11" fill="#166534" stroke-linecap="round"/>
      <path d="M 61 68 Q 64 45 58 24 Q 55 45 61 68" stroke="#ca8a04" stroke-width="11" fill="#166534" stroke-linecap="round"/>
    `)
  },
  {
    id: 'plant_calathea',
    name: 'Calathea Orbifolia Rayada',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <ellipse cx="50" cy="50" rx="35" ry="30" fill="#047857"/>
      <!-- Rayas geométricas características -->
      <path d="M 50 20 L 50 80" stroke="#a7f3d0" stroke-width="3"/>
      <path d="M 50 30 Q 68 32 80 40" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      <path d="M 50 45 Q 72 48 83 55" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      <path d="M 50 60 Q 68 65 78 72" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      <path d="M 50 30 Q 32 32 20 40" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      <path d="M 50 45 Q 28 48 17 55" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      <path d="M 50 60 Q 32 65 22 72" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
    `)
  },
  {
    id: 'plant_cactus_flower',
    name: 'Cactus del Desierto con Flor',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fff7ed"/>
      <!-- Maceta blanca geométrica -->
      <path d="M 33 66 L 67 66 L 63 88 L 37 88 Z" fill="#e2e8f0"/>
      <!-- Cuerpo de cactus redondeado -->
      <rect x="36" y="28" width="28" height="42" rx="14" fill="#15803d"/>
      <line x1="43" y1="32" x2="43" y2="68" stroke="#166534" stroke-width="2"/>
      <line x1="50" y1="30" x2="50" y2="68" stroke="#166534" stroke-width="2"/>
      <line x1="57" y1="32" x2="57" y2="68" stroke="#166534" stroke-width="2"/>
      <!-- Flor fucsia radiante -->
      <circle cx="50" cy="24" r="9" fill="#ec4899"/>
      <circle cx="50" cy="24" r="4" fill="#fbbf24"/>
    `)
  },
  {
    id: 'plant_sunflower',
    name: 'Girasol Radiante de Verano',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <!-- Corona de pétalos dorados -->
      <g transform="translate(50,50)">
        ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-30" rx="6" ry="14" fill="#eab308" transform="rotate(${i * 30})"/>`).join('')}
      </g>
      <!-- Disco central semillas -->
      <circle cx="50" cy="50" r="18" fill="#78350f"/>
      <circle cx="50" cy="50" r="15" fill="#451a03"/>
    `)
  },
  {
    id: 'plant_fern',
    name: 'Helecho Silvestre Fresco',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Tallo curvo con frondas -->
      <path d="M 30 85 Q 50 55 70 20" stroke="#15803d" stroke-width="3" fill="none"/>
      ${[28, 38, 48, 58, 68].map(y => `
        <ellipse cx="${y - 4}" cy="${y + 5}" rx="9" ry="3.5" transform="rotate(-30 ${y - 4} ${y + 5})" fill="#22c55e"/>
        <ellipse cx="${y + 12}" cy="${y - 5}" rx="9" ry="3.5" transform="rotate(25 ${y + 12} ${y - 5})" fill="#16a34a"/>
      `).join('')}
    `)
  },
  {
    id: 'plant_lavender',
    name: 'Lavanda Provenzal Aromática',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#faf5ff"/>
      <line x1="50" y1="85" x2="50" y2="25" stroke="#16a34a" stroke-width="2.5"/>
      ${[25, 33, 41, 49, 57].map(y => `
        <circle cx="45" cy="${y}" r="4.5" fill="#a855f7"/>
        <circle cx="55" cy="${y}" r="4.5" fill="#9333ea"/>
        <circle cx="50" cy="${y - 3}" r="4" fill="#c084fc"/>
      `).join('')}
    `)
  },
  {
    id: 'plant_olive',
    name: 'Olivo del Mediterráneo',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f7fee7"/>
      <path d="M 50 85 Q 48 55 52 35" stroke="#78350f" stroke-width="4.5" fill="none"/>
      <ellipse cx="40" cy="38" rx="10" ry="4" transform="rotate(-35 40 38)" fill="#65a30d"/>
      <ellipse cx="62" cy="38" rx="10" ry="4" transform="rotate(35 62 38)" fill="#65a30d"/>
      <ellipse cx="42" cy="52" rx="10" ry="4" transform="rotate(-25 42 52)" fill="#84cc16"/>
      <ellipse cx="60" cy="52" rx="10" ry="4" transform="rotate(25 60 52)" fill="#84cc16"/>
      <!-- Olivas violetas -->
      <circle cx="48" cy="44" r="4.5" fill="#3b0764"/>
      <circle cx="58" cy="46" r="4" fill="#3b0764"/>
    `)
  },
  {
    id: 'plant_aloe_vera',
    name: 'Aloe Vera Medicinal',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdfa"/>
      <path d="M 34 68 L 66 68 L 62 86 L 38 86 Z" fill="#0d9488"/>
      <!-- Puntas carnosas con espinas -->
      <path d="M 50 68 Q 50 40 50 15 Q 46 40 50 68" fill="#14b8a6"/>
      <path d="M 48 68 Q 36 45 28 25 Q 40 46 48 68" fill="#0f766e"/>
      <path d="M 52 68 Q 64 45 72 25 Q 60 46 52 68" fill="#0f766e"/>
    `)
  },
  {
    id: 'plant_ficus_lyrata',
    name: 'Ficus Lyrata Hoja Violín',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <path d="M 50 85 L 50 25" stroke="#78350f" stroke-width="3"/>
      <!-- Hoja ancha de violín -->
      <path d="M 50 25 C 75 20 85 45 68 60 C 80 72 65 80 50 78 C 35 80 20 72 32 60 C 15 45 25 20 50 25 Z" fill="#15803d"/>
      <path d="M 50 25 L 50 78" stroke="#86efac" stroke-width="2"/>
    `)
  },
  {
    id: 'plant_pothos_golden',
    name: 'Potos Dorado Colgante',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <path d="M 50 80 Q 50 50 50 25 C 75 35 75 60 50 80 C 25 60 25 35 50 25 Z" fill="#16a34a"/>
      <!-- Manchas amarillas variegadas -->
      <ellipse cx="42" cy="45" rx="5" ry="9" fill="#fde047" opacity="0.8"/>
      <ellipse cx="58" cy="55" rx="4" ry="8" fill="#fde047" opacity="0.8"/>
    `)
  },
  {
    id: 'plant_palm_areca',
    name: 'Palmera Areca Tropical',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <path d="M 50 85 Q 35 50 22 25" stroke="#15803d" stroke-width="2.5" fill="none"/>
      <path d="M 50 85 Q 50 48 50 18" stroke="#15803d" stroke-width="2.5" fill="none"/>
      <path d="M 50 85 Q 65 50 78 25" stroke="#15803d" stroke-width="2.5" fill="none"/>
      ${[30, 45, 60].map(y => `
        <line x1="${y - 10}" y1="${y}" x2="${y - 18}" y2="${y - 8}" stroke="#22c55e" stroke-width="2"/>
        <line x1="${100 - y + 10}" y1="${y}" x2="${100 - y + 18}" y2="${y - 8}" stroke="#22c55e" stroke-width="2"/>
      `).join('')}
    `)
  },
  {
    id: 'plant_rosemary',
    name: 'Romero Aromático Silvestre',
    category: 'plants',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f8fafc"/>
      <path d="M 50 85 L 50 20" stroke="#52525b" stroke-width="3"/>
      ${[25, 38, 51, 64].map(y => `
        <line x1="50" y1="${y}" x2="35" y2="${y - 8}" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
        <line x1="50" y1="${y}" x2="65" y2="${y - 8}" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
        <circle cx="35" cy="${y - 8}" r="2" fill="#60a5fa"/>
        <circle cx="65" cy="${y - 8}" r="2" fill="#60a5fa"/>
      `).join('')}
    `)
  },

  // --- ANIMALES DE LA NATURALEZA (10) ---
  {
    id: 'anim_hummingbird',
    name: 'Colibrí Esmeralda Floral',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfeff"/>
      <!-- Pico largo libador -->
      <line x1="68" y1="44" x2="88" y2="40" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <!-- Cuerpo colibrí -->
      <ellipse cx="52" cy="48" rx="16" ry="10" transform="rotate(-15 52 48)" fill="#0d9488"/>
      <circle cx="64" cy="44" r="7" fill="#059669"/>
      <circle cx="66" cy="42" r="1.5" fill="#f8fafc"/>
      <!-- Alas desplegadas en vuelo -->
      <path d="M 46 44 Q 30 20 40 18 Q 48 30 50 42 Z" fill="#2dd4bf"/>
      <!-- Cola bifurcada -->
      <path d="M 38 52 L 20 62 L 28 50 Z" fill="#047857"/>
    `)
  },
  {
    id: 'anim_honeybee',
    name: 'Abeja Reina Polinizadora',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <!-- Alas transparentes -->
      <ellipse cx="44" cy="35" rx="8" ry="16" transform="rotate(-25 44 35)" fill="#bfdbfe" opacity="0.6"/>
      <ellipse cx="56" cy="35" rx="8" ry="16" transform="rotate(25 56 35)" fill="#bfdbfe" opacity="0.6"/>
      <!-- Cuerpo con rayas doradas y negras -->
      <ellipse cx="50" cy="54" rx="16" ry="20" fill="#eab308"/>
      <rect x="34" y="46" width="32" height="4" rx="2" fill="#18181b"/>
      <rect x="35" y="55" width="30" height="4" rx="2" fill="#18181b"/>
      <rect x="38" y="64" width="24" height="4" rx="2" fill="#18181b"/>
      <circle cx="45" cy="42" r="2.5" fill="#18181b"/>
      <circle cx="55" cy="42" r="2.5" fill="#18181b"/>
    `)
  },
  {
    id: 'anim_butterfly',
    name: 'Mariposa Monarca Real',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fff7ed"/>
      <!-- Alas simétricas naranjas y negras -->
      <path d="M 50 50 Q 20 15 20 40 Q 20 65 50 55 Z" fill="#ea580c"/>
      <path d="M 50 50 Q 80 15 80 40 Q 80 65 50 55 Z" fill="#ea580c"/>
      <path d="M 50 55 Q 30 65 35 78 Q 45 80 50 60 Z" fill="#f97316"/>
      <path d="M 50 55 Q 70 65 65 78 Q 55 80 50 60 Z" fill="#f97316"/>
      <line x1="50" y1="35" x2="50" y2="70" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="34" r="3" fill="#18181b"/>
    `)
  },
  {
    id: 'anim_ladybug',
    name: 'Mariquita de la Suerte',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <circle cx="50" cy="55" r="26" fill="#dc2626"/>
      <circle cx="50" cy="32" r="12" fill="#18181b"/>
      <line x1="50" y1="36" x2="50" y2="81" stroke="#18181b" stroke-width="2.5"/>
      <!-- Puntos negros icónicos -->
      <circle cx="40" cy="48" r="4" fill="#18181b"/>
      <circle cx="60" cy="48" r="4" fill="#18181b"/>
      <circle cx="36" cy="62" r="4" fill="#18181b"/>
      <circle cx="64" cy="62" r="4" fill="#18181b"/>
      <circle cx="44" cy="73" r="3" fill="#18181b"/>
      <circle cx="56" cy="73" r="3" fill="#18181b"/>
    `)
  },
  {
    id: 'anim_treefrog',
    name: 'Rana Arborícola de Ojos Rojos',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <!-- Ojos grandes fucsia rojizo -->
      <circle cx="36" cy="35" r="10" fill="#dc2626"/>
      <circle cx="64" cy="35" r="10" fill="#dc2626"/>
      <circle cx="36" cy="35" r="4" fill="#18181b"/>
      <circle cx="64" cy="35" r="4" fill="#18181b"/>
      <!-- Rostro verde rana -->
      <ellipse cx="50" cy="55" rx="28" ry="22" fill="#22c55e"/>
      <path d="M 40 60 Q 50 66 60 60" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/>
    `)
  },
  {
    id: 'anim_owl',
    name: 'Búho Sabio Guardián',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f8fafc"/>
      <ellipse cx="50" cy="54" rx="26" ry="30" fill="#78350f"/>
      <circle cx="38" cy="44" r="11" fill="#fef08a"/>
      <circle cx="62" cy="44" r="11" fill="#fef08a"/>
      <circle cx="38" cy="44" r="5" fill="#18181b"/>
      <circle cx="62" cy="44" r="5" fill="#18181b"/>
      <!-- Pico curvado -->
      <path d="M 47 48 L 53 48 L 50 56 Z" fill="#ea580c"/>
    `)
  },
  {
    id: 'anim_chameleon',
    name: 'Camaleón de Jardín',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <circle cx="48" cy="48" r="22" fill="#84cc16"/>
      <circle cx="56" cy="42" r="9" fill="#65a30d"/>
      <circle cx="57" cy="42" r="3.5" fill="#18181b"/>
      <!-- Cola en espiral -->
      <path d="M 28 58 Q 18 64 24 74 Q 30 78 30 70" stroke="#84cc16" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M 45 56 Q 52 58 60 54" stroke="#4d7c0f" stroke-width="2.5" fill="none"/>
    `)
  },
  {
    id: 'anim_fox',
    name: 'Zorrito Rojo del Bosque',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fff7ed"/>
      <!-- Orejas triangulares puntiagudas -->
      <path d="M 30 40 L 22 18 L 40 30 Z" fill="#ea580c"/>
      <path d="M 70 40 L 78 18 L 60 30 Z" fill="#ea580c"/>
      <!-- Cara zorro con mejillas blancas -->
      <path d="M 25 38 Q 50 32 75 38 L 50 72 Z" fill="#ea580c"/>
      <path d="M 32 45 Q 50 52 40 68 L 25 38 Z" fill="#ffffff"/>
      <path d="M 68 45 Q 50 52 60 68 L 75 38 Z" fill="#ffffff"/>
      <circle cx="38" cy="45" r="2.5" fill="#18181b"/>
      <circle cx="62" cy="45" r="2.5" fill="#18181b"/>
      <circle cx="50" cy="66" r="3.5" fill="#18181b"/>
    `)
  },
  {
    id: 'anim_turtle',
    name: 'Tortuga Silvestre Zen',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Patas y cabeza -->
      <circle cx="70" cy="50" r="7" fill="#84cc16"/>
      <circle cx="72" cy="48" r="1.5" fill="#18181b"/>
      <circle cx="35" cy="35" r="5" fill="#84cc16"/>
      <circle cx="35" cy="65" r="5" fill="#84cc16"/>
      <!-- Caparazón geométrico -->
      <ellipse cx="48" cy="50" rx="22" ry="18" fill="#15803d"/>
      <ellipse cx="48" cy="50" rx="14" ry="10" stroke="#86efac" stroke-width="2" fill="none"/>
    `)
  },
  {
    id: 'anim_snail',
    name: 'Caracol Explorador',
    category: 'animals',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <!-- Cuerpo alargado -->
      <path d="M 20 72 Q 50 68 76 72 Q 78 60 68 64 Z" fill="#a3e635"/>
      <circle cx="72" cy="60" r="5" fill="#a3e635"/>
      <line x1="72" y1="58" x2="76" y2="48" stroke="#a3e635" stroke-width="2"/>
      <circle cx="76" cy="48" r="1.5" fill="#18181b"/>
      <!-- Concha espiral -->
      <circle cx="44" cy="54" r="18" fill="#d97706"/>
      <circle cx="44" cy="54" r="12" fill="#f59e0b"/>
      <circle cx="44" cy="54" r="6" fill="#fbbf24"/>
    `)
  },

  // --- ELEMENTOS E ILUSTRACIONES DIVERTIDAS (6) ---
  {
    id: 'nat_happy_sprout',
    name: 'Brote Germinado Alegre',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <!-- Tierra fértil -->
      <path d="M 22 75 Q 50 68 78 75 Q 50 85 22 75 Z" fill="#78350f"/>
      <path d="M 50 72 Q 50 45 50 35" stroke="#16a34a" stroke-width="4.5" fill="none"/>
      <!-- Dos hojitas sonrientes -->
      <path d="M 50 40 Q 30 35 32 20 Q 48 24 50 40 Z" fill="#22c55e"/>
      <path d="M 50 40 Q 70 35 68 20 Q 52 24 50 40 Z" fill="#16a34a"/>
      <circle cx="44" cy="52" r="2" fill="#15803d"/>
      <circle cx="56" cy="52" r="2" fill="#15803d"/>
      <path d="M 46 58 Q 50 62 54 58" stroke="#15803d" stroke-width="2" fill="none"/>
    `)
  },
  {
    id: 'nat_golden_watering_can',
    name: 'Regadera Dorada Vintage',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fefce8"/>
      <!-- Cuerpo regadera -->
      <rect x="30" y="44" width="30" height="28" rx="6" fill="#eab308"/>
      <!-- Asa elegante -->
      <path d="M 30 48 Q 16 58 30 68" stroke="#ca8a04" stroke-width="4" fill="none"/>
      <!-- Caño y roseta -->
      <line x1="60" y1="60" x2="78" y2="40" stroke="#ca8a04" stroke-width="4"/>
      <ellipse cx="80" cy="38" rx="4" ry="7" transform="rotate(-30 80 38)" fill="#a16207"/>
      <!-- Gotas mágicas de agua -->
      <circle cx="86" cy="46" r="2" fill="#38bdf8"/>
      <circle cx="84" cy="54" r="2.5" fill="#0284c7"/>
    `)
  },
  {
    id: 'nat_glass_terrarium',
    name: 'Terrario Mágico de Cristal',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdfa"/>
      <!-- Forma geométrica de terrario -->
      <polygon points="50,18 78,40 68,78 32,78 22,40" stroke="#0d9488" stroke-width="3" fill="#ccfbf1" fill-opacity="0.4"/>
      <!-- Paisaje interior -->
      <path d="M 32 78 L 68 78 L 64 68 L 36 68 Z" fill="#78350f"/>
      <circle cx="44" cy="62" r="6" fill="#10b981"/>
      <circle cx="54" cy="60" r="8" fill="#059669"/>
    `)
  },
  {
    id: 'nat_smiling_sun',
    name: 'Sol Radiante Sonriente',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#fffbeb"/>
      <!-- Rayos del sol -->
      <g transform="translate(50,50)">
        ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="-38" x2="0" y2="-44" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" transform="rotate(${i * 45})"/>`).join('')}
      </g>
      <circle cx="50" cy="50" r="24" fill="#fbbf24"/>
      <circle cx="43" cy="46" r="2.5" fill="#78350f"/>
      <circle cx="57" cy="46" r="2.5" fill="#78350f"/>
      <path d="M 43 55 Q 50 61 57 55" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="51" r="3" fill="#f87171" opacity="0.6"/>
      <circle cx="64" cy="51" r="3" fill="#f87171" opacity="0.6"/>
    `)
  },
  {
    id: 'nat_dew_leaf',
    name: 'Hoja Sagrada con Rocío',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#ecfdf5"/>
      <path d="M 50 82 C 18 65 20 28 50 18 C 80 28 82 65 50 82 Z" fill="#10b981"/>
      <line x1="50" y1="22" x2="50" y2="78" stroke="#047857" stroke-width="2.5"/>
      <!-- Gota de agua brillante con reflejo -->
      <circle cx="43" cy="46" r="8" fill="#38bdf8"/>
      <circle cx="41" cy="43" r="2.5" fill="#ffffff"/>
    `)
  },
  {
    id: 'nat_clover_luck',
    name: 'Trébol de Cuatro Hojas',
    category: 'nature',
    url: makeSvgUrl(`
      <circle cx="50" cy="50" r="48" fill="#f0fdf4"/>
      <path d="M 50 50 Q 52 75 48 88" stroke="#15803d" stroke-width="3" fill="none"/>
      <!-- 4 folíolos en forma de corazón -->
      <path d="M 50 50 Q 38 30 50 25 Q 62 30 50 50 Z" fill="#22c55e"/>
      <path d="M 50 50 Q 70 38 75 50 Q 70 62 50 50 Z" fill="#16a34a"/>
      <path d="M 50 50 Q 62 70 50 75 Q 38 70 50 50 Z" fill="#22c55e"/>
      <path d="M 50 50 Q 30 62 25 50 Q 30 38 50 50 Z" fill="#16a34a"/>
    `)
  }
];
