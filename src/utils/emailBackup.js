import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_7t2a1y4';
const TEMPLATE_ID = 'template_57uxo1s';
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo';

emailjs.init(PUBLIC_KEY);

export function sendEmailBackup(email, jsonData, appName = 'TrioLog') {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: email,
    subject: `Varmuuskopio: ${appName} ${date}`,
    backup_data: JSON.stringify(jsonData, null, 2),
    app_name: appName,
    date,
  });
}
