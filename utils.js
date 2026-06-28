/**
 * Engineering Utilities for Area Management App
 * @author Principal Software Engineer
 */

// 1. تحويل المساحة من متر مربع إلى (فدان، قيراط، سهم)
export function convertToFeddans(areaInSquareMeters) {
    const feddanM2 = 4200.833;
    const qiratM2 = 175.035;
    const sahmM2 = 7.293;

    let remaining = areaInSquareMeters;
    
    const feddans = Math.floor(remaining / feddanM2);
    remaining %= feddanM2;
    
    const qirats = Math.floor(remaining / qiratM2);
    remaining %= qiratM2;
    
    const sahms = (remaining / sahmM2).toFixed(2);
    
    return {
        feddan: feddans,
        qirat: qirats,
        sahm: sahms
    };
}

// 2. دوال هندسية متقدمة
export const Geometry = {
    // مساحة الدائرة
    circleArea: (r) => Math.PI * Math.pow(r, 2),
    // محيط الدائرة
    circlePerimeter: (r) => 2 * Math.PI * r,
    // مساحة قطاع دائري
    sectorArea: (r, angle) => (angle / 360) * Math.PI * Math.pow(r, 2),
    // مساحة القطع الناقص (Ellipse)
    ellipseArea: (a, b) => Math.PI * a * b,
    // مساحة المضلع المنتظم
    regularPolygonArea: (n, side) => (n * Math.pow(side, 2)) / (4 * Math.tan(Math.PI / n)),
    // حجم الأسطوانة
    cylinderVolume: (r, h) => Math.PI * Math.pow(r, 2) * h,
    // حجم الكرة
    sphereVolume: (r) => (4 / 3) * Math.PI * Math.pow(r, 3),
    // حجم المخروط
    coneVolume: (r, h) => (1 / 3) * Math.PI * Math.pow(r, 2) * h,
};

// 3. تنسيق النتائج
export function formatResult(area) {
    const conv = convertToFeddans(area);
    return {
        text: `${area.toFixed(2)} متر²`,
        details: `${conv.feddan} فدان، ${conv.qirat} قيراط، ${conv.sahm} سهم`
    };
}
