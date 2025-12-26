#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdbool.h>
#include "../deps/swisseph/swephexp.h"

void print_comma() { printf(",\n"); }

int main() {
    double jd, result;
    int year, month, day, retval;
    double hour, xx[6], cusps[13], ascmc[10];
    char serr[256], star[41], buf[256];
    int32 gregflag = SE_GREG_CAL;
    
    printf("{\n");
    
    // === Date/Time Functions ===
    printf("  \"date_time\": {\n");
    
    jd = swe_julday(2000, 1, 1, 12.0, gregflag);
    printf("    \"julday\": %.15f", jd); print_comma();
    
    swe_revjul(2451545.0, gregflag, &year, &month, &day, &hour);
    printf("    \"revjul\": {\"year\": %d, \"month\": %d, \"day\": %d, \"hour\": %.15f}", 
           year, month, day, hour); print_comma();
    
    double tjd_ptr;
    retval = swe_date_conversion(2000, 1, 1, 12.0, 'g', &tjd_ptr);
    printf("    \"date_conversion\": {\"retval\": %d, \"jd\": %.15f}", retval, tjd_ptr); print_comma();
    
    double dret[2];
    retval = swe_utc_to_jd(2000, 1, 1, 12, 0, 0, gregflag, dret, serr);
    printf("    \"utc_to_jd\": {\"retval\": %d, \"et\": %.15f, \"ut\": %.15f}", 
           retval, dret[0], dret[1]); print_comma();
    
    int y, mo, d, h, mi;
    double sec;
    swe_jdet_to_utc(2451545.0, gregflag, &y, &mo, &d, &h, &mi, &sec);
    printf("    \"jdet_to_utc\": {\"year\": %d, \"month\": %d, \"day\": %d}", y, mo, d); print_comma();
    
    swe_jdut1_to_utc(2451545.0, gregflag, &y, &mo, &d, &h, &mi, &sec);
    printf("    \"jdut1_to_utc\": {\"year\": %d, \"month\": %d, \"day\": %d}", y, mo, d); print_comma();
    
    swe_utc_time_zone(2000, 1, 1, 12, 0, 0, 1.0, &y, &mo, &d, &h, &mi, &sec);
    printf("    \"utc_time_zone\": {\"year\": %d, \"hour\": %d}", y, h); print_comma();
    
    printf("    \"deltat\": %.15f", swe_deltat(2451545.0)); print_comma();
    
    double te;
    swe_time_equ(2451545.0, &te, serr);
    printf("    \"time_equ\": %.15f", te); print_comma();
    
    printf("    \"sidtime\": %.15f", swe_sidtime(2451545.0)); print_comma();
    printf("    \"sidtime0\": %.15f", swe_sidtime0(2451545.0, 23.44, 0)); print_comma();
    printf("    \"day_of_week\": %d\n", swe_day_of_week(2451545.0));
    
    printf("  }"); print_comma();
    
    // === Planetary Calculations ===
    printf("  \"planets\": {\n");
    
    retval = swe_calc(2451545.0, SE_SUN, SEFLG_SWIEPH, xx, serr);
    printf("    \"calc_sun\": {\"retval\": %d, \"lon\": %.15f, \"lat\": %.15f}", 
           retval, xx[0], xx[1]); print_comma();
    
    retval = swe_calc_ut(2451545.0, SE_MOON, SEFLG_SWIEPH, xx, serr);
    printf("    \"calc_ut_moon\": {\"retval\": %d, \"lon\": %.15f, \"lat\": %.15f}", 
           retval, xx[0], xx[1]); print_comma();
    
    swe_get_planet_name(SE_SUN, buf);
    printf("    \"get_planet_name\": \"%s\"\n", buf);
    
    printf("  }"); print_comma();
    
    // === Fixed Stars ===
    printf("  \"stars\": {\n");
    
    strcpy(star, "Sirius");
    retval = swe_fixstar(star, 2451545.0, SEFLG_SWIEPH, xx, serr);
    printf("    \"fixstar\": {\"retval\": %d, \"lon\": %.15f}", retval, xx[0]); print_comma();
    
    strcpy(star, "Sirius");
    retval = swe_fixstar_ut(star, 2451545.0, SEFLG_SWIEPH, xx, serr);
    printf("    \"fixstar_ut\": {\"retval\": %d, \"lon\": %.15f}", retval, xx[0]); print_comma();
    
    strcpy(star, "Sirius");
    double mag;
    retval = swe_fixstar_mag(star, &mag, serr);
    printf("    \"fixstar_mag\": {\"retval\": %d, \"mag\": %.15f}", retval, mag); print_comma();
    
    strcpy(star, "Sirius");
    retval = swe_fixstar2(star, 2451545.0, SEFLG_SWIEPH, xx, serr);
    printf("    \"fixstar2\": {\"retval\": %d, \"lon\": %.15f}", retval, xx[0]); print_comma();
    
    strcpy(star, "Sirius");
    retval = swe_fixstar2_ut(star, 2451545.0, SEFLG_SWIEPH, xx, serr);
    printf("    \"fixstar2_ut\": {\"retval\": %d, \"lon\": %.15f}", retval, xx[0]); print_comma();
    
    strcpy(star, "Sirius");
    retval = swe_fixstar2_mag(star, &mag, serr);
    printf("    \"fixstar2_mag\": {\"retval\": %d, \"mag\": %.15f}\n", retval, mag);
    
    printf("  }"); print_comma();
    
    // === Houses ===
    printf("  \"houses\": {\n");
    
    retval = swe_houses(2451545.0, 47.0, 8.0, 'P', cusps, ascmc);
    printf("    \"houses\": {\"retval\": %d, \"cusp1\": %.15f, \"asc\": %.15f}", 
           retval, cusps[1], ascmc[0]); print_comma();
    
    retval = swe_houses_ex(2451545.0, SEFLG_SWIEPH, 47.0, 8.0, 'P', cusps, ascmc);
    printf("    \"houses_ex\": {\"retval\": %d, \"cusp1\": %.15f}", retval, cusps[1]); print_comma();
    
    retval = swe_houses_ex2(2451545.0, SEFLG_SWIEPH, 47.0, 8.0, 'P', cusps, ascmc, NULL, NULL, serr);
    printf("    \"houses_ex2\": {\"retval\": %d, \"cusp1\": %.15f}", retval, cusps[1]); print_comma();
    
    retval = swe_houses_armc(12.0, 47.0, 23.44, 'P', cusps, ascmc);
    printf("    \"houses_armc\": {\"retval\": %d, \"cusp1\": %.15f}", retval, cusps[1]); print_comma();
    
    retval = swe_houses_armc_ex2(12.0, 47.0, 23.44, 'P', cusps, ascmc, NULL, NULL, serr);
    printf("    \"houses_armc_ex2\": {\"retval\": %d, \"cusp1\": %.15f}", retval, cusps[1]); print_comma();
    
    double xpin[2] = {100.0, 0.0};
    result = swe_house_pos(12.0, 47.0, 23.44, 'P', xpin, serr);
    printf("    \"house_pos\": %.15f\n", result);
    
    printf("  }"); print_comma();
    
    // === Auxiliary Math ===
    printf("  \"math\": {\n");
    
    printf("    \"degnorm\": %.15f", swe_degnorm(370.0)); print_comma();
    printf("    \"radnorm\": %.15f", swe_radnorm(2 * M_PI + 0.1)); print_comma();
    printf("    \"rad_midp\": %.15f", swe_rad_midp(0.1, 6.2)); print_comma();
    printf("    \"deg_midp\": %.15f", swe_deg_midp(10.0, 350.0)); print_comma();
    
    int ideg, imin, isec;
    double dsecfr;
    int isgn;
    swe_split_deg(123.456, SE_SPLIT_DEG_ROUND_SEC, &ideg, &imin, &isec, &dsecfr, &isgn);
    printf("    \"split_deg\": {\"deg\": %d, \"min\": %d, \"sec\": %d}", ideg, imin, isec); print_comma();
    
    printf("    \"csnorm\": %d", swe_csnorm(370.0)); print_comma();
    printf("    \"difcsn\": %d", swe_difcsn(10.0, 350.0)); print_comma();
    printf("    \"difdegn\": %.15f", swe_difdegn(10.0, 350.0)); print_comma();
    printf("    \"difcs2n\": %d", swe_difcs2n(10.0, 350.0)); print_comma();
    printf("    \"difdeg2n\": %.15f", swe_difdeg2n(10.0, 350.0)); print_comma();
    printf("    \"difrad2n\": %.15f", swe_difrad2n(0.1, 6.2)); print_comma();
    printf("    \"csroundsec\": %d", swe_csroundsec(123.456789)); print_comma();
    printf("    \"d2l\": %d\n", swe_d2l(123.456));
    
    printf("  }"); print_comma();
    
    // === Coordinate Transforms ===
    printf("  \"transforms\": {\n");
    
    double xpo[3] = {10.0, 0.0, 1.0};
    double xpn[3];
    swe_cotrans(xpo, xpn, 23.44);
    printf("    \"cotrans\": {\"x\": %.15f, \"y\": %.15f}", xpn[0], xpn[1]); print_comma();
    
    double xpo2[6] = {10.0, 0.0, 1.0, 0.1, 0.0, 0.0};
    double xpn2[6];
    swe_cotrans_sp(xpo2, xpn2, 23.44);
    printf("    \"cotrans_sp\": {\"x\": %.15f, \"y\": %.15f}\n", xpn2[0], xpn2[1]);
    
    printf("  }"); print_comma();
    
    // === Ayanamsa ===
    printf("  \"ayanamsa\": {\n");
    
    swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
    printf("    \"get_ayanamsa\": %.15f", swe_get_ayanamsa(2451545.0)); print_comma();
    printf("    \"get_ayanamsa_ut\": %.15f", swe_get_ayanamsa_ut(2451545.0)); print_comma();
    
    double aya;
    swe_get_ayanamsa_ex(2451545.0, SEFLG_SWIEPH, &aya, serr);
    printf("    \"get_ayanamsa_ex\": %.15f", aya); print_comma();
    
    swe_get_ayanamsa_ex_ut(2451545.0, SEFLG_SWIEPH, &aya, serr);
    printf("    \"get_ayanamsa_ex_ut\": %.15f", aya); print_comma();
    
    printf("    \"get_ayanamsa_name\": \"%s\"\n", swe_get_ayanamsa_name(SE_SIDM_LAHIRI));
    
    printf("  }"); print_comma();
    
    // === Phenomena ===
    printf("  \"phenomena\": {\n");
    
    retval = swe_pheno(2451545.0, SE_MOON, SEFLG_SWIEPH, xx, serr);
    printf("    \"pheno\": {\"retval\": %d, \"phase_angle\": %.15f}", retval, xx[0]); print_comma();
    
    retval = swe_pheno_ut(2451545.0, SE_MOON, SEFLG_SWIEPH, xx, serr);
    printf("    \"pheno_ut\": {\"retval\": %d, \"phase_angle\": %.15f}", retval, xx[0]); print_comma();
    
    double geopos[3] = {8.0, 47.0, 400.0};
    double xin[3] = {100.0, 10.0, 1.0};
    double xaz[3];
    swe_azalt(2451545.0, SE_EQU2HOR, geopos, 1013.25, 15.0, xin, xaz);
    printf("    \"azalt\": {\"az\": %.15f, \"alt\": %.15f}", xaz[0], xaz[1]); print_comma();
    
    double xra[3];
    swe_azalt_rev(2451545.0, SE_HOR2EQU, geopos, xaz, xra);
    printf("    \"azalt_rev\": {\"ra\": %.15f, \"dec\": %.15f}", xra[0], xra[1]); print_comma();
    
    printf("    \"refrac\": %.15f", swe_refrac(10.0, 1013.25, 15.0, SE_TRUE_TO_APP)); print_comma();
    printf("    \"refrac_extended\": %.15f\n", swe_refrac_extended(10.0, 400.0, 1013.25, 15.0, 0.0065, SE_TRUE_TO_APP, xx));
    
    printf("  }"); print_comma();
    
    // === Configuration ===
    printf("  \"config\": {\n");
    
    printf("    \"get_tid_acc\": %.15f", swe_get_tid_acc()); print_comma();
    
    swe_set_tid_acc(0.0);
    printf("    \"set_tid_acc_done\": true\n");
    
    printf("  }"); print_comma();
    
    // === Nodes & Apsides ===
    printf("  \"nodes\": {\n");
    
    double xnasc[6], xndsc[6], xperi[6], xaphe[6];
    retval = swe_nod_aps(2451545.0, SE_MOON, SEFLG_SWIEPH, SE_NODBIT_MEAN, 
                         xnasc, xndsc, xperi, xaphe, serr);
    printf("    \"nod_aps\": {\"retval\": %d, \"node_lon\": %.15f}", retval, xnasc[0]); print_comma();
    
    retval = swe_nod_aps_ut(2451545.0, SE_MOON, SEFLG_SWIEPH, SE_NODBIT_MEAN,
                            xnasc, xndsc, xperi, xaphe, serr);
    printf("    \"nod_aps_ut\": {\"retval\": %d, \"node_lon\": %.15f}\n", retval, xnasc[0]);
    
    printf("  }"); print_comma();
    
    // === String Formatting ===
    printf("  \"strings\": {\n");
    
    swe_cs2timestr(12.5, ' ', true, buf);
    printf("    \"cs2timestr\": \"%s\"", buf); print_comma();
    
    swe_cs2lonlatstr(123.456, 'E', 'W', buf);
    printf("    \"cs2lonlatstr\": \"%s\"", buf); print_comma();
    
    swe_cs2degstr(123.456, buf);
    printf("    \"cs2degstr\": \"%s\"\n", buf);
    
    printf("  }"); print_comma();
    
    // === Version ===
    swe_version(buf);
    printf("  \"version\": \"%s\"\n", buf);
    
    printf("}\n");
    
    swe_close();
    return 0;
}
