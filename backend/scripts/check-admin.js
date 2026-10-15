// Chalane ka tareeqa:  npm run check:admin
// Batata hai ke .env ki ADMIN_EMAILS wale accounts database mein hain ya nahi, aur un ka role kya hai.
// Kuch badalta nahi, sirf parhta hai. Doosre users ki emails chhupi hui (masked) dikhti hain.
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getAdminEmails } from '../utils/adminEmails.js';

const mask = (email = '') => {
  const [name = '', domain = ''] = String(email).split('@');
  return `${name.slice(0, 2)}***@${domain}`;
};

const emails = getAdminEmails();
console.log('ADMIN_EMAILS (.env se parhi gayi):', emails.length ? emails.map(mask).join(', ') : '(khali!)');
if (!emails.length) {
  console.log('-> backend/.env mein ADMIN_EMAILS=aap-ki-email likhein, phir server dobara chalayein.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const collation = { locale: 'en', strength: 2 }; // case ka farq nahi
  let problem = false;

  for (const email of emails) {
    const user = await User.findOne({ email }).collation(collation).select('email role');
    if (!user) {
      problem = true;
      console.log(`XX  ${mask(email)}: is email se koi account database mein nahi hai.`);
      console.log('     -> Pehle isi email se signup karein (spelling .env jaisi), ya .env ki email apne account ki email se milayein.');
    } else if (user.role !== 'admin') {
      problem = true;
      console.log(`XX  ${mask(email)}: account hai, lekin role "${user.role || 'user'}" hai (admin nahi).`);
      console.log('     -> Backend band kar ke dobara chalayein (npm run dev), phir logout/login karein.');
    } else {
      console.log(`OK  ${mask(email)}: database mein role "admin" hai.`);
    }
  }

  const admins = await User.find({ role: 'admin' }).select('email');
  console.log(`\nDatabase mein kul admin: ${admins.length} -> ${admins.map((a) => mask(a.email)).join(', ') || '(koi nahi)'}`);

  const all = await User.find({}).select('email role').limit(50);
  console.log('\nSab accounts (email masked):');
  for (const u of all) console.log(`  ${mask(u.email)}  ${u.role || 'user'}`);

  await mongoose.disconnect();
  console.log(problem ? '\nAbhi masla hai (upar XX dekhein).' : '\nDatabase ki taraf se sab theek hai.');
  process.exit(problem ? 1 : 0);
} catch (err) {
  console.error('Database se connect nahi ho saka:', err.message);
  process.exit(1);
}