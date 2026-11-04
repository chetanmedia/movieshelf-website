// Builds region data for every country + simplified world map paths.
// Region rules: DVD regions 1-6 and Blu-ray A/B/C, per the region definitions published by
// german-way.com and the-home-cinema-guide.com (both summarise the DVD Forum / BDA region maps).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoPath, geoEqualEarth } from 'd3-geo';
import { countries } from 'countries-list';
const require = createRequire(import.meta.url);
const iso = require('i18n-iso-countries');
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'));

const S = a => new Set(a.split(' '));
const SEA = S('BN KH ID LA MY MM PH SG TH TL VN');
const MIDEAST = S('TR CY IL PS LB SY JO IQ IR KW SA BH QA AE OM YE');
const CENTRAL_ASIA = S('KZ UZ TM KG TJ');
const SOUTH_ASIA = S('IN PK BD NP LK BT MV AF');
const EAST_EU_C = S('BY RU UA MD');           // Blu-ray Region C in Europe (plus KZ, already Central Asia)
const DVD5_EU = S('BY RU UA');               // DVD Region 5 in Europe
const DVD2_AFRICA = S('EG ZA LS SZ');
const UNSURE_DVD = S('GE AM AZ TN GU AS MP VI UM GF');           // sources disagree; we tell people to check
const DVD_AMERICAS_1 = S('US CA PR BM');

function regions(cc, cont) {
  let dvd, bd;
  // ---- DVD ----
  if (DVD_AMERICAS_1.has(cc)) dvd = '1';
  else if (cc === 'CN') dvd = '6';
  else if (cc === 'JP' || cc === 'GL' || cc === 'GF') dvd = '2';
  else if (SEA.has(cc) || ['KR', 'TW', 'HK', 'MO'].includes(cc)) dvd = '3';
  else if (MIDEAST.has(cc) || DVD2_AFRICA.has(cc)) dvd = '2';
  else if (cont === 'EU') dvd = DVD5_EU.has(cc) ? '5' : '2';
  else if (cont === 'NA' || cont === 'SA' || cont === 'OC') dvd = '4';
  else if (cont === 'AF' || CENTRAL_ASIA.has(cc) || SOUTH_ASIA.has(cc) || ['MN', 'KP'].includes(cc)) dvd = '5';
  else if (['GE', 'AM', 'AZ'].includes(cc)) dvd = '2';
  else dvd = '5';
  // ---- Blu-ray ----
  if (cc === 'CN' || cc === 'MN' || CENTRAL_ASIA.has(cc) || SOUTH_ASIA.has(cc) || EAST_EU_C.has(cc)) bd = 'C';
  else if (cc === 'GL') bd = 'B';
  else if (cont === 'NA' || cont === 'SA' || SEA.has(cc) || ['JP', 'KR', 'KP', 'TW', 'HK', 'MO'].includes(cc)) bd = 'A';
  else bd = 'B';
  return { dvd, bd, unsure: UNSURE_DVD.has(cc) || undefined };
}
// PAL/NTSC for DVDs bought in a country (only used for a gentle warning)
const NTSC = S('US CA MX JP KR TW PH PR GT HN SV NI CR PA CU DO JM HT BS BB TT CO VE EC PE BO CL MM');

const list = Object.entries(countries).map(([cc, c]) => {
  const r = regions(cc, c.continent);
  return { cc, name: c.name, ...r, ntsc: NTSC.has(cc) || undefined };
}).filter(c => c.cc !== 'AQ').sort((a, b) => a.name.localeCompare(b.name));

// map
const geo = feature(topo, topo.objects.countries);
geo.features = geo.features.filter(f => f.properties.name !== 'Antarctica');
const proj = geoEqualEarth().fitExtent([[4, 4], [956, 466]], geo);
const path = geoPath(proj);
const round = d => d.replace(/(\d+)\.\d+/g, (m) => String(Math.round(+m)));
const shapes = [];
for (const f of geo.features) {
  let cc = iso.numericToAlpha2(String(f.id).padStart(3, '0'));
  if (!cc) cc = { 'Kosovo': 'XK', 'N. Cyprus': 'CY', 'Somaliland': 'SO' }[f.properties.name];
  if (!cc) { console.error('no iso for', f.properties.name, f.id); continue; }
  const d = path(f); if (!d) continue;
  shapes.push([cc, round(d)]);
}
const byCc = Object.fromEntries(list.map(c => [c.cc, c]));
const missing = shapes.filter(([cc]) => !byCc[cc]).map(([cc]) => cc);
if (missing.length) console.error('shapes without data:', missing);
fs.writeFileSync('regions.json', JSON.stringify({ countries: list, shapes }));
console.log('countries', list.length, 'shapes', shapes.length, 'bytes', fs.statSync('regions.json').size);
// spot checks
for (const cc of ['US', 'CA', 'MX', 'BR', 'GB', 'FR', 'DE', 'JP', 'KR', 'HK', 'CN', 'IN', 'RU', 'UA', 'AU', 'NZ', 'ZA', 'EG', 'NG', 'TR', 'SA', 'SG', 'KZ', 'MN', 'KP', 'GL', 'MD', 'PL', 'PR', 'TN', 'GE']) console.log(cc, byCc[cc]?.name, 'DVD', byCc[cc]?.dvd, 'BD', byCc[cc]?.bd, byCc[cc]?.unsure ? '(unsure)' : '', byCc[cc]?.ntsc ? 'NTSC' : '');
