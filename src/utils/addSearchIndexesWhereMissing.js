const parseEpub = require('./parseEpub')
const { getIndexedBookJSON } = require('./indexEpub')
const { runQuery, getFromS3 } = require('./util')

module.exports = async ({ s3, connection, next, log }) => {

  return

  log([`SearchIndexing: starting...`])

  // Books with too large of indexes: 44, 180, 265

  const books = await runQuery({
    query: `

      SELECT DISTINCT
        b.id

      FROM book as b
        LEFT JOIN \`book-idp\` as bi ON (bi.book_id=b.id)

      WHERE bi.book_id IS NOT NULL

      ORDER BY b.id

    `,
    vars: {
    },
    connection,
    next,
  })

  log([`SearchIndexing: found ${books.length} books.`])

  for(let idx in books) {
    const bookId = books[idx].id
  
    const baseUri = `epub_content/book_${bookId}`

    try {
      await getFromS3(`${baseUri}/search_index.json`)
      log([`SearchIndexing: Search index already exists for book id ${bookId}.`])
      continue
    } catch(e) {}

    log([`SearchIndexing: Parsing book id ${bookId}...`])

    const { spines, success } = await parseEpub({ baseUri, log })

    if(!success) {
      log([`SearchIndexing: Could not parse epub for book id ${bookId}.`], 3)
      continue
    }

    const putEPUBFile = (relfilepath, body) => new Promise(resolve => {
      var key = 'epub_content/book_' + bookId + '/' + relfilepath
      log(['SearchIndexing: Upload file to S3...', key])

      s3.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentLength: body.byteCount,
      }, (err, data) => {
        if(err) {
          log(['SearchIndexing: ...FAILED to upload to S3', key], 3)
        } else {
          log(['SearchIndexing: ...uploaded to S3', key])
        }

        resolve()
      })
    })

    log([`SearchIndexing: Indexing book id ${bookId}...`])

    // create index for search
    try {
      await putEPUBFile('search_index.json', await getIndexedBookJSON({ baseUri, spines, log }))
    } catch(e) {
      log(e.message, 3)
      continue
    }

    log([`SearchIndexing: Book id ${bookId} successful.`])

  }

}