#!/bin/bash
mkdir -p wasm
emcc -O3 -o swisseph.js \
    $(ls deps/swisseph/*.c | grep -v 'swetest.c' | grep -v 'swemini.c' | grep -v 'obama.c' | grep -v 'swephgen') \
    --preload-file ./deps/sweph@/sweph \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="Swisseph" \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_swe_set_ephe_path", "_swe_house_pos", "_swe_julday", "_swe_calc_ut", "_swe_deltat", "_swe_time_equ", "_swe_sidtime0", "_swe_sidtime", "_swe_cotrans", "_swe_cotrans_sp", "_swe_get_tid_acc", "_swe_set_tid_acc", "_swe_degnorm", "_swe_radnorm", "_swe_rad_midp", "_swe_deg_midp", "_swe_split_deg", "_swe_csnorm", "_swe_difcsn", "_swe_difdegn", "_swe_difcs2n", "_swe_difdeg2n", "_swe_difrad2n", "_swe_csroundsec", "_swe_d2l", "_swe_day_of_week", "_swe_cs2timestr", "_swe_cs2lonlatstr", "_swe_cs2degstr", "_swe_date_conversion", "_swe_revjul", "_swe_utc_to_jd", "_swe_jdet_to_utc", "_swe_jdut1_to_utc", "_swe_utc_time_zone", "_swe_version", "_swe_calc", "_swe_fixstar", "_swe_fixstar_ut", "_swe_fixstar_mag", "_swe_fixstar2", "_swe_fixstar2_ut", "_swe_fixstar2_mag", "_swe_close", "_swe_set_ephe_path", "_swe_set_jpl_file", "_swe_get_planet_name", "_swe_set_topo", "_swe_set_sid_mode", "_swe_get_ayanamsa", "_swe_get_ayanamsa_ut", "_swe_get_ayanamsa_ex", "_swe_get_ayanamsa_ex_ut", "_swe_get_ayanamsa_name", "_swe_nod_aps", "_swe_nod_aps_ut", "_swe_get_orbital_elements", "_swe_orbit_max_min_true_distance", "_swe_heliacal_ut", "_swe_heliacal_pheno_ut", "_swe_vis_limit_mag", "_swe_houses", "_swe_houses_ex", "_swe_houses_ex2", "_swe_houses_armc", "_swe_houses_armc_ex2", "_swe_sol_eclipse_where", "_swe_lun_occult_where", "_swe_sol_eclipse_how", "_swe_sol_eclipse_when_loc", "_swe_lun_occult_when_loc", "_swe_sol_eclipse_when_glob", "_swe_lun_occult_when_glob", "_swe_lun_eclipse_how", "_swe_lun_eclipse_when", "_swe_lun_eclipse_when_loc", "_swe_pheno", "_swe_pheno_ut", "_swe_refrac", "_swe_refrac_extended", "_swe_set_lapse_rate", "_swe_azalt", "_swe_azalt_rev", "_swe_rise_trans", "_swe_rise_trans_true_hor"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "FS", "HEAPF64", "HEAP32", "stringToUTF8", "UTF8ToString"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT="web,node" \
    -s EXPORT_ES6=1 \
    -o wasm/swisseph.js
