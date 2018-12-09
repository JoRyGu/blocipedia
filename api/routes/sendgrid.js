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
    <html>
      <head>
      </head>
      <body style="text-align:center;">
        <h1 style="font-size:5em; font-weight:bold;">Welcome to Blocipedia!</h1>
        <p>To access your account, please enter the code below at the following link.</p>
        <h2 style="font-weight:bold;">${verification.hash}</h2>
        <a href="http://localhost:5000/users/verify" style="box-sizing:border-box;border-color:#348eda;font-weight:400;text-decoration:none;display:inline-block;margin:0;color:#ffffff;background-color:#348eda;border:solid 1px #348eda;border-radius:2px;font-size:14px;padding:12px 45px">
          Click to Verify
        </a>
      </body>
    </html>
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