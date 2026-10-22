// Fictional films used for every case, scan and shelf on the page.
// Artwork was generated for Movieshelf; `npm run covers` downloads it into /public/covers.
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3ChGIroln00rZM8zqAt5a6seyqG/';

export const REMOTE = {
  'boxset-front': CDN + 'hf_20261022_071238_8d0dc033-2120-4cd5-bd51-eb2371fda95f.png',
};

export const ORIGINALS = [
  { id: 'northbound', t: 'Northbound', y: 2011, d: 'Mara Ellison', fmt: 'uhd', m: 'mountains',
    c: ['#08162e', '#2f6fd6', '#f6c46a'], tag: 'The road only goes one way.',
    syn: 'A retired cartographer drives the length of a country she once mapped, chasing a letter that arrived thirty years late.',
    run: 124, au: 'Dolby Atmos · DTS-HD MA 5.1', genre: 'Drama, Road movie', ean: '501234567890',
    front: 'northbound-front', back: 'northbound-back', disc: 'northbound-disc' },
  { id: 'lowtide', t: 'Low Tide', y: 2019, d: 'Jonah Reyes', fmt: 'bluray', m: 'waves',
    c: ['#05252a', '#13a39b', '#ff8a4c'], tag: 'Some things only surface once.',
    syn: 'When the sea pulls back further than anyone remembers, a fishing town finds the boat it buried a decade ago.',
    run: 108, au: 'DTS-HD MA 5.1', genre: 'Mystery', ean: '502468135790', front: 'lowtide-front' },
  { id: 'orbit', t: 'Orbit Nine', y: 2024, d: 'Ines Valk', fmt: 'uhd', m: 'rings',
    c: ['#0f0826', '#7b5cff', '#ff5fa2'], tag: 'Nine days. One window home.',
    syn: 'A salvage crew has nine days to reach the only launch window back to Earth before their station falls silent.',
    run: 131, au: 'Dolby Atmos', genre: 'Sci-fi, Thriller', ean: '503691472580', front: 'orbit-front', back: 'orbit-back' },
  { id: 'glass', t: 'The Glass Hour', y: 2016, d: 'Theo Marchetti', fmt: 'bluray', m: 'city',
    c: ['#160c06', '#e0782a', '#ffd27a'], tag: 'Every city keeps one secret.',
    syn: 'A night-shift window cleaner witnesses something forty floors up and spends one long hour deciding who to tell.',
    run: 97, au: 'DTS:X', genre: 'Neo-noir', ean: '504812736450', front: 'glass-front' },
  { id: 'paper', t: 'Paper Moons', y: 2022, d: 'Sung-ah Park', fmt: 'bluray', m: 'moon',
    c: ['#24091b', '#d94c7a', '#ffe3c4'], tag: 'A love story, folded in half.',
    syn: 'Two origami artists trade anonymous letters across a city, each folded into a different shape of the moon.',
    run: 112, au: 'Dolby TrueHD 7.1', genre: 'Romance', ean: '505937261840', front: 'paper-front' },
  { id: 'static', t: 'Static', y: 2008, d: 'Ola Brandt', fmt: 'dvd', m: 'noise',
    c: ['#0b0b0c', '#c8102e', '#f1f1f1'], tag: 'Stay on this channel.',
    syn: 'A late-night radio host starts receiving calls from listeners who say they are tuning in from next week.',
    run: 94, au: 'Dolby Digital 5.1', genre: 'Horror', ean: '506173829460', front: 'static-front' },
];

export const BOXSET = { t: 'The Northbound Trilogy', front: 'boxset-front',
  parts: [
    { t: 'Northbound', sub: 'Part I', y: 2011 },
    { t: 'Northbound II', sub: 'Whiteout', y: 2015 },
    { t: 'Northbound III', sub: 'The Last Road', y: 2020 },
  ] };

export const FMT_LABEL = { uhd: '4K UHD', bluray: 'Blu-ray', dvd: 'DVD' };

// Real cover scans supplied for the site: full wraps split into front / spine / back.
const scan = id => ({ front: `scans/${id}-front.jpg`, back: `scans/${id}-back.jpg`, spine: `scans/${id}-spine.jpg` });
const dflt = { c: ['#0b0d14', '#2a3352', '#e8e2d0'], m: 'noise', tag: '', syn: '' };
export const FILMS = [
  { ...dflt, id: 'dune', t: 'Dune', y: 2021, d: 'Denis Villeneuve', fmt: 'bluray', run: 155, au: 'Dolby Atmos · DTS-HD MA 5.1', bc: { u: 0.819, v: 0.895, r: 1.1594, code: '5051891184725' }, ...scan('dune') },
  { ...dflt, id: 'inception', t: 'Inception', y: 2010, d: 'Christopher Nolan', fmt: 'uhd', run: 148, ...scan('inception') },
  { ...dflt, id: 'avatar', t: 'Avatar', y: 2009, d: 'James Cameron', fmt: 'dvd', run: 162, bc: { u: 0.775, v: 0.08, r: 1.399, code: '024543656067' }, ...scan('avatar') },
  { ...dflt, id: 'joker', t: 'Joker', y: 2019, d: 'Todd Phillips', fmt: 'bluray', run: 121, bc: { u: 0.8, v: 0.782, r: 1.1667, code: '9398700034960' }, ...scan('joker') },
  { ...dflt, id: 'oppenheimer', t: 'Oppenheimer', y: 2023, d: 'Christopher Nolan', fmt: 'uhd', run: 181, bc: { u: 0.681, v: 0.059, r: 1.1667, code: '191329253120' }, ...scan('oppenheimer') },
  { ...dflt, id: 'matrix', t: 'The Matrix', y: 1999, d: 'The Wachowskis', fmt: 'dvd', run: 136, bc: { u: 0.787, v: 0.084, r: 1.4094, code: '085391773726' }, ...scan('matrix') },
  { ...dflt, id: 'darkknight', t: 'The Dark Knight', y: 2008, d: 'Christopher Nolan', fmt: 'bluray', run: 153, ...scan('darkknight') },
  { ...dflt, id: 'interstellar', t: 'Interstellar', y: 2014, d: 'Christopher Nolan', fmt: 'dvd', run: 169, ...scan('interstellar') },
  { ...dflt, id: 'jurassic', t: 'Jurassic Park', y: 1993, d: 'Steven Spielberg', fmt: 'dvd', run: 127, bc: { u: 0.762, v: 0.067, r: 1.4094, code: '025192078729' }, ...scan('jurassic') },
  { ...dflt, id: 'endgame', t: 'Avengers: Endgame', y: 2019, d: 'Anthony & Joe Russo', fmt: 'dvd', run: 182, ...scan('endgame') },
];
export const DEMO = FILMS[0];
export const BARCODED = FILMS.filter(f => f.bc);
