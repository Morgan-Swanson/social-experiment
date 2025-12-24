const fs = require('fs');

// Write environment variables to .env.production for Next.js SSR runtime
const envVars = [
  { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
  { name: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET },
  { name: 'NEXTAUTH_URL', value: process.env.NEXTAUTH_URL }
];

let content = '';
for (const { name, value } of envVars) {
  if (value) {
    content += `${name}=${value}\n`;
  }
}

fs.writeFileSync('.env.production', content);
console.log('Successfully wrote .env.production with environment variables');