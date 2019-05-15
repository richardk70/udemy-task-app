const sgAPIKey = process.env.SG;
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(sgAPIKey);


const sendWelcomeEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'admin@friendcrash.com',
        subject: 'Welcome to Task App!',
        text: `Welcome to the app, ${name}.`,
        html: `<h1>Welcome to friendcrash.</h1>`
    };
    sgMail.send(msg);
}

const sendCancelEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'admin@friendcrash.com',
        subject: 'Sorry to see you go',
        text: `May we ask why you are leaving friendcrash, ${name}?`
    };
    sgMail.send(msg);
}

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancelEmail: sendCancelEmail
}