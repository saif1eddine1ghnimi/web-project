// backend/utils/generateCredentials.js
const generateLogin = (name) => {
  const baseLogin = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.');
  
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${baseLogin}.${randomSuffix}`;
};

const generatePassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = { generateLogin, generatePassword };