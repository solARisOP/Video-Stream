import nodemailer from "nodemailer"
import {google} from "googleapis"

const getTransporter = async() => {

    const OAuth2 = google.auth.OAuth2;

    const OAUTH_EMAIL = process.env.OAUTH_EMAIL
    const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID
    const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET
    const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN

    const oauth2Client = new OAuth2(
        OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground',
        
    );

    oauth2Client.setCredentials({
        refresh_token: OAUTH_REFRESH_TOKEN
    });

    var accessToken = await oauth2Client.getAccessToken()

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: OAUTH_EMAIL,
            clientId: OAUTH_CLIENT_ID,
            clientSecret: OAUTH_CLIENT_SECRET,
            refreshToken: OAUTH_REFRESH_TOKEN,
            accessToken: accessToken.toString()
        }
    });

    return transporter
}

export {
    getTransporter
}