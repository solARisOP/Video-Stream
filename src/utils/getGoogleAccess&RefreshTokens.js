import axios from "axios"
import qs from "qs"

const getgoogleOAuthTokens = async(code) => {
    const url = 'https://oauth2.googleapis.com/token'

    const values = {
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code'
    }

    try {
        const { data } = await axios.post(url, qs.stringify(values),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        return data
    } catch (error) {
        console.error(error) 
    }
}

const getGoogleUser = async(id_token ,access_token) => {
    try {
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${access_token}`, {
            headers: {
                Authorization: `Bearer ${id_token}`
            }
        })

        return data
    } catch (error) {
        console.error(error) 
    }
}


export {
    getgoogleOAuthTokens, 
    getGoogleUser
}