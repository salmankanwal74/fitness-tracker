// Database mein hamesha kg aur cm mein data save hota hai.
// Ye functions sirf DISPLAY aur INPUT ke waqt convert karne ke liye hain.

export const kgToLbs = (kg) => kg * 2.20462;
export const lbsToKg = (lbs) => lbs / 2.20462;

export const cmToIn = (cm) => cm / 2.54;
export const inToCm = (inches) => inches * 2.54;

// weightUnit = 'kg' | 'lbs'
export const displayWeight = (kgValue, weightUnit) => {
  if (kgValue === undefined || kgValue === null || kgValue === '') return '';
  const value = weightUnit === 'lbs' ? kgToLbs(kgValue) : kgValue;
  return Math.round(value * 10) / 10;
};

export const toStorageWeight = (inputValue, weightUnit) => {
  const num = parseFloat(inputValue);
  if (Number.isNaN(num)) return inputValue;
  return weightUnit === 'lbs' ? lbsToKg(num) : num;
};

// lengthUnit = 'cm' | 'in'
export const displayLength = (cmValue, lengthUnit) => {
  if (cmValue === undefined || cmValue === null || cmValue === '') return '';
  const value = lengthUnit === 'in' ? cmToIn(cmValue) : cmValue;
  return Math.round(value * 10) / 10;
};

export const toStorageLength = (inputValue, lengthUnit) => {
  const num = parseFloat(inputValue);
  if (Number.isNaN(num)) return inputValue;
  return lengthUnit === 'in' ? inToCm(num) : num;
};