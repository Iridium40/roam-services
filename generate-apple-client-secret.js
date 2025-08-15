import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

try {
  // Check if the private key file exists
  const keyPath = './AuthKey_539NXXHJ4V.p8';
  
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Error: AuthKey_539NXXHJ4V.p8 file not found!');
    console.log('Please make sure the Apple private key file is in the current directory.');
    process.exit(1);
  }

  console.log('📱 Generating Apple Sign-In Client Secret...\n');

  const privateKey = fs.readFileSync(keyPath, 'utf8');

  const clientSecret = jwt.sign({}, privateKey, {
    algorithm: 'ES256',           // ✅ Correct for Apple
    expiresIn: '6m',             // ✅ 6 months is fine
    audience: 'https://appleid.apple.com', // ✅ Correct
    issuer: '9N9XH594C7',        // ✅ Your Team ID
    subject: 'com.roamyourbestlife.roamwebapp', // ✅ Your Bundle ID
    keyid: '539NXXHJ4V'          // ✅ Your Key ID
  });

  console.log('✅ Client Secret Generated Successfully!\n');
  console.log('🔑 Client Secret:');
  console.log(clientSecret);
  console.log('\n📋 Copy this client secret to your environment variables or configuration.');
  console.log('⏰ Note: This token expires in 6 months.');

} catch (error) {
  console.error('❌ Error generating client secret:', error.message);
  
  if (error.message.includes('no such file')) {
    console.log('\n💡 Make sure AuthKey_539NXXHJ4V.p8 is in the same directory as this script.');
  } else if (error.message.includes('invalid key')) {
    console.log('\n💡 Make sure the .p8 file contains a valid Apple private key.');
  }
}
