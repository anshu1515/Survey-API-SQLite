require('dotenv').config()
const jwt = require('jsonwebtoken')

exports.verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"]

    if(!token) {
        return res.status(403).send({
            message: 'No token provided!'
        })
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if(err) {
            return res.json({
                message: "Invalid Token..."
            })
        }
        req.userId = decoded.id
        next()
    })

}