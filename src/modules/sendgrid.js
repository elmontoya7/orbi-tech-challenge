const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_KEY)

// send example!!!!
// const msg = {
//   to: email,
//   from: 'no-reply@urbvan.com',
//   subject: '[Developer Portal] Please reset your password.',
//   html: `<!DOCTYPE html><html lang=en><meta charset=UTF-8><meta content="IE=edge"http-equiv=X-UA-Compatible><meta content="width=device-width,initial-scale=1"name=viewport><title>[Developer Portal] Please reset your password.</title><link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"rel=stylesheet><style>*{font-family:Roboto,sans-serif}</style><div style="font-size:14px;margin:30px 15px"><div style="border:1px solid #0f1033;border-radius:5px;padding:30px 50px;max-width:600px;margin:auto"><p style=text-align:center;margin-bottom:30px><img alt=Logo height=38 src=https://urbvan.com/wp-content/themes/urbvan/assets/img/logo.svg><p style=text-align:center;font-size:16px><strong>Reset your Developer Portal password.</strong><p style=text-align:center;margin-bottom:60px>These things happen. Don't worry, we've got you covered. Follow the button below to reset your password:<p style=text-align:center><a href="${emailResetLink}" style="background-color:#0f1033;color:#fff;border-radius:5px;padding:10px 15px;border:none;cursor:pointer">Reset password</a></div><p style="font-size:10px;text-align:center;padding:0 15px;margin-top:30px">The link expires in 15 minutes for your own security. But don't worry you can always request a recovery password email again.</div>`,
// }

// const emailRes = await sgMail.send(msg)
// if (emailRes[0].statusCode == 202) {
//   console.log('Email sent to', email, '::', emailRes[0].statusCode)
// } else {
//   console.log('Error sending email to email', email, '::', emailRes[0].statusCode)
// }

module.exports = sgMail