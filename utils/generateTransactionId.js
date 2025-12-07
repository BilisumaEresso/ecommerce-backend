const CHAR_SET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateTransactionId(length = 16) {
  let id = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHAR_SET.length);
    id += CHAR_SET[randomIndex];
  }
  return id;
}

module.exports = generateTransactionId;
