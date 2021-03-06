const util = require('../utils/util')

module.exports = function (app, connection, ensureAuthenticatedAndCheckIDP, log) {

  // get search term suggestions
  app.get(['/searchtermsuggest', '/searchtermsuggest/:bookId'],
    ensureAuthenticatedAndCheckIDP,
    async (req, res, next) => {

      const { bookId } = req.params
      const { termPrefix } = req.query

      const now = util.timestampToMySQLDatetime()

      log(`Search term prefix "${termPrefix}"...`)
      const rows = await util.runQuery({
        query: `
          SELECT
            btit.term,
            SUM(btit.count) as totalCount

          FROM book AS b
            LEFT JOIN \`book-idp\` AS bi ON (bi.book_id=b.id)
            LEFT JOIN computed_book_access AS cba ON (
              cba.book_id=b.id
              AND cba.idp_id=:idpId
              AND cba.user_id=:userId
              AND (
                cba.expires_at IS NULL
                OR cba.expires_at>:now
              )
            )
            LEFT JOIN book_textnode_index_term AS btit ON (btit.book_id=b.id)

            WHERE bi.idp_id=:idpId
              ${req.user.isAdmin ? `` : `
                AND cba.book_id IS NOT NULL
              `}
              ${!bookId ? `` : `
                AND b.id=:bookId
              `}
              AND btit.term LIKE "${termPrefix.replace(/"/g, '')}%"

              GROUP BY btit.term
              ORDER BY totalCount DESC
  
            LIMIT 10
            OFFSET 0
        `,
        vars: {
          bookId,
          userId: req.user.id,
          idpId: req.user.idpId,
          now,
        },
        connection,
        next,
      })

      return res.send({
        success: true,
        suggestions: rows.map(({ term }) => term),
      })

    }
  )

  // search one or more books
  app.get(['/search', '/search/:bookId'],
    ensureAuthenticatedAndCheckIDP,
    async (req, res, next) => {

      const { bookId } = req.params
      let { searchStr, limit, offset } = req.query

      limit = Math.min(Math.max(0, parseInt(limit, 10) || 100), 100)
      offset = Math.max(parseInt(offset, 10) || 0, 0)

      const now = util.timestampToMySQLDatetime()

      if(bookId) {
        const accessInfo = await util.hasAccess({ bookId, req, connection, log, next })
        if(!accessInfo) {
          log(['Forbidden search: user does not have access to this book'], 3)
          res.status(403).send({ error: 'Forbidden' })
          return
        }
      }

      log(`Search "${searchStr}"...`)
      const results = await util.runQuery({
        query: `
          SELECT
            bti.*

          FROM book AS b
            LEFT JOIN \`book-idp\` AS bi ON (bi.book_id=b.id)
            LEFT JOIN computed_book_access AS cba ON (
              cba.book_id=b.id
              AND cba.idp_id=:idpId
              AND cba.user_id=:userId
              AND (
                cba.expires_at IS NULL
                OR cba.expires_at>:now
              )
            )
            LEFT JOIN book_textnode_index AS bti ON (bti.book_id=b.id)
            LEFT JOIN latest_location AS ll ON (ll.book_id=b.id AND ll.user_id=:userId)

            WHERE bi.idp_id=:idpId
              ${req.user.isAdmin ? `` : `
                AND cba.book_id IS NOT NULL
              `}
              ${!bookId ? `` : `
                AND b.id=:bookId
              `}
              AND
                MATCH(bti.text)
                AGAINST(:search IN BOOLEAN MODE)

            ORDER BY ll.updated_at DESC

            LIMIT ${limit}
            OFFSET ${offset}
        `,
        vars: {
          bookId,
          userId: req.user.id,
          idpId: req.user.idpId,
          now,
          search: searchStr.split(new RegExp(util.SPACE_OR_PUNCTUATION, 'u')).map(term => `+${term}`).join(' '),
        },
        connection,
        next,
      })

      util.convertJsonColsFromStrings({ tableName: 'book_textnode_index', rows: results })

      return res.send({
        success: true,
        results,
      })

    }
  )

}