var util = require('../utils/util')

module.exports = function (app, connection, log) {

  app.post('/updateuserinfo',
    util.decodeJWT({ jwtColInIdp: 'userInfoJWT', connection, log }),
    (req, res, next) => {
      log(["/updateuserinfo post", req.body, req.payload_decoded], 2)

      util.updateUserInfo({
        connection,
        log,
        userInfo: req.payload_decoded,
        idpId: req.idpId,
        next,
      }).then(() => {
        res.send({ success: true })
      })
    }
  )

}