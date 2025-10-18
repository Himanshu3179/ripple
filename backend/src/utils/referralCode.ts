const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateReferralCode = (length = 8) => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[index];
  }
  return result;
};
