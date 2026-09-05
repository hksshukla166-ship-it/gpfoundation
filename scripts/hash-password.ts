import bcrypt from "bcryptjs";

const password = process.argv.slice(2).join(" ");
if (!password) {
  console.error("Usage: npm run hash-password -- <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
