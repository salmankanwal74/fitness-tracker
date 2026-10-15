// Email bhejne ka helper.
// - SMTP_HOST set ho to nodemailer se asli email jati hai (npm install nodemailer)
// - SMTP_HOST set na ho aur NODE_ENV production na ho to email ka text sirf terminal mein print hota hai
//   (development mein reset link yahin se copy kar lein)
export const sendEmail = async ({ to, subject, text }) => {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP set nahi hai, email nahi bheji ja sakti');
    }
    console.log('\n========== [EMAIL - development mode] ==========');
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text}`);
    console.log('================================================\n');
    return;
  }

  let nodemailer;
  try {
    nodemailer = (await import('nodemailer')).default;
  } catch {
    throw new Error('nodemailer install nahi hai. Chalayein: npm install nodemailer');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};