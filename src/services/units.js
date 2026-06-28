window.AREA_UNITS = {
    m2:      { id: 'm2',      label: 'متر² (م²)',        factor: 1,           type: 'area' },
    feddan:  { id: 'feddan',  label: 'فدان / قيراط / سهم', factor: 4200.833,  type: 'area', special: true },
    km2:     { id: 'km2',     label: 'كيلومتر² (كم²)',    factor: 1e-6,        type: 'area' },
    cm2:     { id: 'cm2',     label: 'سنتيمتر² (سم²)',    factor: 1e4,         type: 'area' },
    ft2:     { id: 'ft2',     label: 'قدم² (قدم²)',        factor: 10.7639,     type: 'area' },
    yd2:     { id: 'yd2',     label: 'يارد² (يارد²)',       factor: 1.19599,     type: 'area' },
    acre:    { id: 'acre',    label: 'أكر (أكر)',         factor: 0.000247105, type: 'area' },
    ha:      { id: 'ha',      label: 'هكتار (هكتار)',        factor: 0.0001,      type: 'area' },
    donum:   { id: 'donum',   label: 'دونم',              factor: 0.001,       type: 'area' }
};

window.VOLUME_UNITS = {
    m3:   { id: 'm3',   label: 'متر³ (م³)',    factor: 1,       type: 'volume' },
    liter:{ id: 'liter',label: 'لتر (ل)',       factor: 1000,    type: 'volume' },
    ml:   { id: 'ml',   label: 'ميليلتر (مل)',  factor: 1e6,     type: 'volume' },
    ft3:  { id: 'ft3',  label: 'قدم³ (قدم³)',    factor: 35.3147, type: 'volume' },
    gal:  { id: 'gal',  label: 'جالون (جالون)',   factor: 264.172, type: 'volume' }
};

window.getSelectedUnit = function(type) {
    return localStorage.getItem('selected_' + type + '_unit') || (type === 'area' ? 'm2' : 'm3');
};

window.setSelectedUnit = function(type, unitId) {
    localStorage.setItem('selected_' + type + '_unit', unitId);
};

window.formatAreaValue = function(areaInM2) {
    const unitId = window.getSelectedUnit('area');
    const unit = window.AREA_UNITS[unitId];
    if (!unit) return areaInM2.toFixed(2) + ' م²';
    if (unit.special) {
        const feddan = Math.floor(areaInM2 / 4200.833);
        const rem1 = areaInM2 % 4200.833;
        const qirat = Math.floor(rem1 / 175.035);
        const sahm = (rem1 % 175.035) / 7.293;
        return feddan + ' فدان، ' + qirat + ' قيراط، ' + sahm.toFixed(2) + ' سهم';
    }
    return (areaInM2 * unit.factor).toFixed(4) + ' ' + unit.label.split('(')[0].trim();
};

window.formatVolumeValue = function(volInM3) {
    const unitId = window.getSelectedUnit('volume');
    const unit = window.VOLUME_UNITS[unitId];
    if (!unit) return volInM3.toFixed(2) + ' م³';
    return (volInM3 * unit.factor).toFixed(4) + ' ' + unit.label.split('(')[0].trim();
};

window.createUnitSelectorHTML = function(type, onchangeFn) {
    const units = type === 'area' ? window.AREA_UNITS : window.VOLUME_UNITS;
    const current = window.getSelectedUnit(type);
    let options = '';
    for (const key in units) {
        const selected = key === current ? 'selected' : '';
        options += `<option value="${key}" ${selected}>${units[key].label}</option>`;
    }
    return `<select class="unit-selector" onchange="${onchangeFn}(this.value)">${options}</select>`;
};


