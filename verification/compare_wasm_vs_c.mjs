import SwissEph from '../src/swisseph.js';
import { readFileSync } from 'fs';

const C = JSON.parse(readFileSync('./verification/c_ref.json', 'utf8'));
const TOL = 1e-6;
let pass = 0, fail = 0;
const fails = [];

function chk(name, got, exp) {
  let ok;
  if (typeof exp === 'number') ok = Number.isFinite(got) && Math.abs(got - exp) < TOL;
  else if (typeof exp === 'string') ok = String(got).includes(exp) || got === exp;
  else ok = got === exp;
  if (ok) { pass++; }
  else { fail++; fails.push(`${name}: got=${JSON.stringify(got)} exp=${JSON.stringify(exp)}`); }
}

const s = new SwissEph();
await s.initSwissEph();

// date_time
const dt = C.date_time;
chk('julday', s.julday(2000,1,1,12.0), dt.julday);
const rj = s.revjul(2451545.0,1);
chk('revjul.year', rj.year, dt.revjul.year); chk('revjul.hour', rj.hour, dt.revjul.hour);
chk('date_conversion', s.date_conversion(2000,1,1,12.0,'g'), dt.date_conversion.jd);
const uj = s.utc_to_jd(2000,1,1,12,0,0,1);
chk('utc_to_jd.et', uj.julianDayET, dt.utc_to_jd.et); chk('utc_to_jd.ut', uj.julianDayUT, dt.utc_to_jd.ut);
chk('jdet_to_utc.year', s.jdet_to_utc(2451545.0,1).year, dt.jdet_to_utc.year);
chk('jdut1_to_utc.year', s.jdut1_to_utc(2451545.0,1).year, dt.jdut1_to_utc.year);
const tz = s.utc_time_zone(2000,1,1,12,0,0,1.0);
chk('utc_time_zone.year', tz.year, dt.utc_time_zone.year); chk('utc_time_zone.hour', tz.hour, dt.utc_time_zone.hour);
chk('deltat', s.deltat(2451545.0), dt.deltat);
chk('time_equ', s.time_equ(2451545.0), dt.time_equ);
chk('sidtime', s.sidtime(2451545.0), dt.sidtime);
chk('sidtime0', s.sidtime0(2451545.0,23.44,0), dt.sidtime0);
chk('day_of_week', s.day_of_week(2451545.0), dt.day_of_week);

// planets
const c = s.calc(2451545.0, s.SE_SUN, s.SEFLG_SWIEPH);
chk('calc.lon', c.longitude, C.planets.calc_sun.lon); chk('calc.lat', c.latitude, C.planets.calc_sun.lat);
const cu = s.calc_ut(2451545.0, s.SE_MOON, s.SEFLG_SWIEPH);
chk('calc_ut.lon', cu[0], C.planets.calc_ut_moon.lon); chk('calc_ut.lat', cu[1], C.planets.calc_ut_moon.lat);
chk('get_planet_name', s.get_planet_name(s.SE_SUN), C.planets.get_planet_name);

// stars
chk('fixstar.lon', s.fixstar('Sirius',2451545.0,s.SEFLG_SWIEPH)?.[0], C.stars.fixstar.lon);
chk('fixstar_ut.lon', s.fixstar_ut('Sirius',2451545.0,s.SEFLG_SWIEPH)?.[0], C.stars.fixstar_ut.lon);
chk('fixstar_mag', s.fixstar_mag('Sirius'), C.stars.fixstar_mag.mag);
chk('fixstar2.lon', s.fixstar2('Sirius',2451545.0,s.SEFLG_SWIEPH)?.[0], C.stars.fixstar2.lon);
chk('fixstar2_ut.lon', s.fixstar2_ut('Sirius',2451545.0,s.SEFLG_SWIEPH)?.[0], C.stars.fixstar2_ut.lon);
chk('fixstar2_mag', s.fixstar2_mag('Sirius'), C.stars.fixstar2_mag.mag);

// houses
const h = s.houses(2451545.0,47.0,8.0,'P');
chk('houses.cusp1', h.cusps[1], C.houses.houses.cusp1); chk('houses.asc', h.ascmc[0], C.houses.houses.asc);
chk('houses_ex.cusp1', s.houses_ex(2451545.0,s.SEFLG_SWIEPH,47.0,8.0,'P').cusps[1], C.houses.houses_ex.cusp1);
chk('houses_ex2.cusp1', s.houses_ex2(2451545.0,s.SEFLG_SWIEPH,47.0,8.0,'P').cusps[1], C.houses.houses_ex2.cusp1);
chk('houses_armc.cusp1', s.houses_armc(12.0,47.0,23.44,'P').cusps[1], C.houses.houses_armc.cusp1);
chk('houses_armc_ex2.cusp1', s.houses_armc_ex2(12.0,47.0,23.44,'P').cusps[1], C.houses.houses_armc_ex2.cusp1);
chk('house_pos', s.house_pos(12.0,47.0,23.44,'P',100.0,0.0), C.houses.house_pos);

// math
const m = C.math;
chk('degnorm', s.degnorm(370.0), m.degnorm);
chk('radnorm', s.radnorm(2*Math.PI+0.1), m.radnorm);
chk('rad_midp', s.rad_midp(0.1,6.2), m.rad_midp);
chk('deg_midp', s.deg_midp(10.0,350.0), m.deg_midp);
const sd = s.split_deg(123.456, s.SE_SPLIT_DEG_ROUND_SEC);
chk('split_deg.deg', sd.degree, m.split_deg.deg); chk('split_deg.min', sd.min, m.split_deg.min); chk('split_deg.sec', sd.second, m.split_deg.sec);
chk('csnorm', s.csnorm(370.0), m.csnorm);
chk('difcsn', s.difcsn(10.0,350.0), m.difcsn);
chk('difdegn', s.difdegn(10.0,350.0), m.difdegn);
chk('difcs2n', s.difcs2n(10.0,350.0), m.difcs2n);
chk('difdeg2n', s.difdeg2n(10.0,350.0), m.difdeg2n);
chk('difrad2n', s.difrad2n(0.1,6.2), m.difrad2n);
chk('csroundsec', s.csroundsec(123.456789), m.csroundsec);
chk('d2l', s.d2l(123.456), m.d2l);

// transforms
const ct = s.cotrans([10.0,0.0,1.0],23.44);
chk('cotrans.x', ct[0], C.transforms.cotrans.x); chk('cotrans.y', ct[1], C.transforms.cotrans.y);
const cts = s.cotrans_sp([10.0,0.0,1.0,0.1,0.0,0.0],23.44);
chk('cotrans_sp.x', cts[0], C.transforms.cotrans_sp.x); chk('cotrans_sp.y', cts[1], C.transforms.cotrans_sp.y);

// ayanamsa
s.set_sid_mode(s.SE_SIDM_LAHIRI,0,0);
chk('get_ayanamsa', s.get_ayanamsa(2451545.0), C.ayanamsa.get_ayanamsa);
chk('get_ayanamsa_ut', s.get_ayanamsa_ut(2451545.0), C.ayanamsa.get_ayanamsa_ut);
chk('get_ayanamsa_ex', s.get_ayanamsa_ex(2451545.0,s.SEFLG_SWIEPH), C.ayanamsa.get_ayanamsa_ex);
chk('get_ayanamsa_ex_ut', s.get_ayanamsa_ex_ut(2451545.0,s.SEFLG_SWIEPH), C.ayanamsa.get_ayanamsa_ex_ut);
chk('get_ayanamsa_name', s.get_ayanamsa_name(s.SE_SIDM_LAHIRI), C.ayanamsa.get_ayanamsa_name);

// phenomena
chk('pheno.phase_angle', s.pheno(2451545.0,s.SE_MOON,s.SEFLG_SWIEPH)?.[0], C.phenomena.pheno.phase_angle);
chk('pheno_ut.phase_angle', s.pheno_ut(2451545.0,s.SE_MOON,s.SEFLG_SWIEPH)?.[0], C.phenomena.pheno_ut.phase_angle);
const az = s.azalt(2451545.0, s.SE_EQU2HOR, [8.0,47.0,400.0], 1013.25, 15.0, [100.0,10.0,1.0]);
chk('azalt.az', az.azimuth, C.phenomena.azalt.az); chk('azalt.alt', az.trueAltitude, C.phenomena.azalt.alt);
const ar = s.azalt_rev(2451545.0, s.SE_HOR2EQU, [8.0,47.0,400.0], [az.azimuth, az.trueAltitude, az.apparentAltitude]);
chk('azalt_rev.ra', ar.ra, C.phenomena.azalt_rev.ra); chk('azalt_rev.dec', ar.dec, C.phenomena.azalt_rev.dec);
chk('refrac', s.refrac(10.0, 1013.25, 15.0, s.SE_TRUE_TO_APP), C.phenomena.refrac);
chk('refrac_extended', s.refrac_extended(10.0, 400.0, 1013.25, 15.0, 0.0065, s.SE_TRUE_TO_APP).converted, C.phenomena.refrac_extended);

// config
chk('get_tid_acc', s.get_tid_acc(), C.config.get_tid_acc);

// nodes
chk('nod_aps.node_lon', s.nod_aps(2451545.0,s.SE_MOON,s.SEFLG_SWIEPH,s.SE_NODBIT_MEAN).asc_node, C.nodes.nod_aps.node_lon);
chk('nod_aps_ut.node_lon', s.nod_aps_ut(2451545.0,s.SE_MOON,s.SEFLG_SWIEPH,s.SE_NODBIT_MEAN).asc_node, C.nodes.nod_aps_ut.node_lon);

// crossings / misc
const cr = C.crossings;
chk('deltat_ex', s.deltat_ex(2451545.0, s.SEFLG_SWIEPH), cr.deltat_ex);
chk('house_name', s.house_name('P'), cr.house_name);
chk('solcross', s.solcross(0.0, 2451545.0, s.SEFLG_SWIEPH), cr.solcross);
chk('mooncross', s.mooncross(0.0, 2451545.0, s.SEFLG_SWIEPH), cr.mooncross);
const mcn = s.mooncross_node(2451545.0, s.SEFLG_SWIEPH);
chk('mooncross_node.jd', mcn.jd, cr.mooncross_node.jd);
chk('mooncross_node.lon', mcn.lon, cr.mooncross_node.lon);
chk('helio_cross.jd', s.helio_cross(s.SE_MARS, 0.0, 2451545.0, s.SEFLG_SWIEPH, 1), cr.helio_cross.jd);
chk('gauquelin_sector', s.gauquelin_sector(2451545.0, s.SE_SUN, '', s.SEFLG_SWIEPH, 0, [8.0,47.0,400.0], 1013.25, 15.0), cr.gauquelin_sector.sector);

// misc
const mi = C.misc;
chk('calc_pctr.lon', s.calc_pctr(2451545.0, s.SE_MARS, s.SE_EARTH, s.SEFLG_SWIEPH)?.[0], mi.calc_pctr.lon);
chk('lat_to_lmt', s.lat_to_lmt(2451545.0, 8.0), mi.lat_to_lmt);
chk('lmt_to_lat', s.lmt_to_lat(2451545.0, 8.0), mi.lmt_to_lat);
const fd = s.get_current_file_data(0);
chk('get_current_file_data.denum', fd.denum, mi.get_current_file_data.denum);
chk('get_current_file_data.start', fd.start, mi.get_current_file_data.start);

// events (rise/set, eclipses, orbital, _ut crossings)
const ev = C.events;
chk('rise_trans.tret', s.rise_trans(2451545.0, s.SE_SUN, '', s.SEFLG_SWIEPH, s.SE_CALC_RISE, [8.0,47.0,400.0], 1013.25, 15.0)?.[0], ev.rise_trans.tret);
chk('sol_eclipse_when_glob.tret', s.sol_eclipse_when_glob(2451545.0, s.SEFLG_SWIEPH, 0, 0)?.tret[0], ev.sol_eclipse_when_glob.tret);
chk('lun_eclipse_when.tret', s.lun_eclipse_when(2451545.0, s.SEFLG_SWIEPH, 0, 0)?.tret[0], ev.lun_eclipse_when.tret);
chk('sol_eclipse_where.lon', s.sol_eclipse_where(ev.sol_eclipse_when_glob.tret, s.SEFLG_SWIEPH)?.geopos[0], ev.sol_eclipse_where.lon);
chk('lun_eclipse_how.umbral', s.lun_eclipse_how(ev.lun_eclipse_when.tret, s.SEFLG_SWIEPH, [8.0,47.0,400.0])?.attr[0], ev.lun_eclipse_how.umbral_mag);
chk('get_orbital_elements', s.get_orbital_elements(2451545.0, s.SE_MARS, s.SEFLG_SWIEPH)?.[0], ev.get_orbital_elements);
chk('orbit_max_min', s.orbit_max_min_true_distance(2451545.0, s.SE_MARS, s.SEFLG_SWIEPH)?.maxDistance, ev.orbit_max_min);
chk('solcross_ut', s.solcross_ut(0.0, 2451545.0, s.SEFLG_SWIEPH), ev.solcross_ut);
chk('mooncross_ut', s.mooncross_ut(0.0, 2451545.0, s.SEFLG_SWIEPH), ev.mooncross_ut);
chk('mooncross_node_ut.jd', s.mooncross_node_ut(2451545.0, s.SEFLG_SWIEPH).jd, ev.mooncross_node_ut);
chk('helio_cross_ut', s.helio_cross_ut(s.SE_MARS, 0.0, 2451545.0, s.SEFLG_SWIEPH, 1), ev.helio_cross_ut);

// strings
chk('cs2timestr', s.cs2timestr(12.5,' ',true), C.strings.cs2timestr);
chk('cs2lonlatstr', s.cs2lonlatstr(123.456,'E','W'), C.strings.cs2lonlatstr);
chk('cs2degstr', s.cs2degstr(123.456), C.strings.cs2degstr);

// version
chk('version', s.version(), C.version);

s.close();
console.log(`\n=== JS(wasm) vs C reference ===`);
console.log(`PASS ${pass}  FAIL ${fail}`);
if (fails.length) { console.log('\nMISMATCHES:'); fails.forEach(f => console.log('  ✗ ' + f)); }
process.exit(fail ? 1 : 0);
