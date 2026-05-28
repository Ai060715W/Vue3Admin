const mysql=require('../../utils/mysql')
const bcrypt = require('bcrypt')
const config = require('config')
const jwt = require('jsonwebtoken')

const login = async (data) => {

    const res = await mysql.findPasswordByUsername(data)

    if (!res) return false

    const payloads = await mysql.selectUser(data.username)

    if (await bcrypt.compare(data.password, res))  {

        return [
            jwt.sign(payloads, config.get('JWTConfig.secret'), {expiresIn: config.get('JWTConfig.expiresIn')}),
            jwt.sign({payloads, type:'refresh'}, config.get('JWTConfig.secret'), {expiresIn: config.get('JWTConfig.reFlushExpiresIn')})
        ]
    }

    else return false
}

module.exports = {
    login
}