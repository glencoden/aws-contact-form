'use strict'

const aws = require('aws-sdk')
const ses = new aws.SES()

function getPageParams(body) {
    let page = ''

    try {
        const parsed = JSON.parse(body)
        page = parsed.page
    } catch (err) {
        console.error(err)
    }

    switch (page) {
        case 'hainarbeit':
            return {
                currentEmail: process.env.EMAIL_HAINARBEIT,
                currentDomain: process.env.DOMAIN_HAINARBEIT,
            }
        case 'looneys':
            return {
                currentEmail: process.env.EMAIL_LOONEYS,
                currentDomain: process.env.DOMAIN_LOONEYS,
            }
        default:
            return {
                currentEmail: process.env.EMAIL_HAINARBEIT,
                currentDomain: process.env.DOMAIN_HAINARBEIT,
            }
    }
}

function generateResponse(code, payload, currentDomain) {
    return {
        statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': currentDomain,
            'Access-Control-Allow-Headers': 'x-requested-with',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(payload),
    }
}

function generateError(code, err, currentDomain) {
    return {
        statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': currentDomain,
            'Access-Control-Allow-Headers': 'x-requested-with',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(err.message),
    }
}

function generateEmailParams(body, currentEmail, currentDomain) {
    const { email, name, content } = JSON.parse(body)

    if (!(email && name && content)) {
        throw new Error('Missing parameters! Make sure to add parameters \'email\', \'name\', \'content\'.')
    }

    return {
        Source: currentEmail,
        Destination: { ToAddresses: [ currentEmail ] },
        ReplyToAddresses: [ email ],
        Message: {
            Body: {
                Text: {
                    Charset: 'UTF-8',
                    Data: `Du hast eine Nachricht von ${name} (${email}).\n\n${content}`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Post von ${currentDomain}`,
            },
        },
    }
}

module.exports.send = async (event) => {
    const pageParams = getPageParams(event.body)

    try {
        const emailParams = generateEmailParams(event.body, pageParams.currentEmail, pageParams.currentDomain)

        const data = await ses.sendEmail(emailParams).promise()

        return generateResponse(200, data, pageParams.currentDomain)
    } catch (err) {
        return generateError(500, err, pageParams.currentDomain)
    }
}
