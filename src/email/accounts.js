const sgmail = require('@sendgrid/mail')

sgmail.setApiKey(process.env.SEND_GRID_API)

const sendMailVerifyAccount = async (email, host, route, token) => {
    try {
        await sgmail.send({
            to: email,
            from: 'no-reply@chatserver.com',
            subject: 'Verification Mail',
            text: 'Hello,\n\n Please verify your account by clicking the link:\nhttp://'
                + host + '/' + route + '/' + token + '\n',
        })
    } catch (error) {
        if (error.response) {
            console.log(error.response)
        } else {
            console.log(error)
        }
    }
}

const sendMailResendPassword = async (email, password) => {
    try {
        await sgmail.send({
            to: email,
            from: 'no-reply@chatserver.com',
            subject: 'Password Reset',
            text: 'Hello,\n\nThis is your new Password:\n\n' + password,
        })
    } catch (error) {
        if (error.response) {
            console.log(error.response)
        } else {
            console.log(error)
        }
    }
}

const sendMailChangeEmail = async (email, host, route, token) => {
    try {
        await sgmail.send({
            to: email,
            from: 'no-reply@chatserver.com',
            subject: 'Verification Mail for new Email',
            text: 'Hello,\n\n Please verify your account by clicking the link:\nhttp://'
                + host + '/' + route + '/' + token + '\n',
        })
    } catch (error) {
        if (error.response) {
            console.log(error.response)
        } else {
            console.log(error)
        }
    }
}

module.exports = {
    sendMailVerifyAccount,
    sendMailResendPassword,
    sendMailChangeEmail
}