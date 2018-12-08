const sgMail = require('@sendgrid/mail');
const randomString = require('randomstring');
const Verification = require('../../db/models').Verification;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async function(user) {
  try{
    const verificationString = randomString.generate(12);
    const userId = user.id;
    const verification = await Verification.create({
      hash: verificationString,
      user_id: userId
    });

    const emailBody = `
    <p>Enter the following at the link below to verify your account: ${verification.hash}</p>
    <a href="http://localhost:5000/users/verify">CLICK ME</a>
  `
  
    const msg = {
      to: user.email,
      from: 'admin@blocipedia.net',
      subject: 'Account Verification',
      text: 'Enter the following at the link below to verify your account: ' + verification.hash,
      html: emailBody
    };
  
    sgMail.send(msg);
  } catch (errors) {
    console.log(errors);
  }
}