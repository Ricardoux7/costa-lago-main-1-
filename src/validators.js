export const patterns = {
  name: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,60}$/,
  document: /^[VEJGP]-?\d{6,9}(-?\d)?$/i,
  phone: /^(\+58|0058|0)?[\s-]?(412|414|416|424|426|212|261|264)[\s-]?\d{7}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  message: /^[\s\S]{10,500}$/,
  title: /^.{4,80}$/,
  cardNumber: /^(?:\d[ -]?){12,18}\d$/, 
  cardExpiry: /^(0[1-9]|1[0-2])\/\d{2}$/, 
  cvv: /^\d{3,4}$/,
  bankReference: /^\d{6,12}$/,
  mobileReference: /^\d{4,8}$/,
  required: /\S/,
};

export function luhn(value) {
  const digits = value.replace(/\D/g, "");
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

export function notExpired(value) {
  const [mm, yy] = value.split("/").map(Number);
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = now.getMonth() + 1;
  return yy > year || (yy === year && mm >= month);
}

patterns.password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/;

patterns.listingTitle = /^.{6,80}$/;
patterns.price = /^\d{4,8}$/;
patterns.smallInt = /^\d{1,2}$/;
patterns.area = /^\d{2,4}$/;
patterns.year = /^(19[5-9]\d|20[0-2]\d)$/;
patterns.monthlyFee = /^\d{1,5}(\.\d{1,2})?$/;
patterns.description = /^[\s\S]{20,600}$/;
patterns.features = /^$|^[^,]{2,40}(,\s*[^,]{2,40}){0,5}$/;
patterns.imageType = /^image\/(jpeg|png|webp)$/;

patterns.tenantDocument = /^[VE]-?\d{6,9}$/i;
