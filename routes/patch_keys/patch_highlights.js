const util = require('../../util');

const getSuccessObj = containedOldPatch => ({
  patch: 'latest_location',
  success: true,
  containedOldPatch: !!containedOldPatch,
})

const getErrorObj = error => ({
  ...getSuccessObj(),
  success: false,
  error,
})

module.exports = {
  
  addPreQueries: ({
    body,
    params,
    preQueries,
  }) => {

    if((body.highlights || []).length > 0) {
      preQueries.queries.push('SELECT spineIdRef, cfi, updated_at, IF(note="", 0, 1) as hasnote FROM `highlight` WHERE user_id=? AND book_id=? AND deleted_at=?');
      preQueries.vars = [
        ...vars,
        params.userId,
        params.bookId,
        util.NOT_DELETED_AT_TIME,
      ];
    } else {
      preQueries.queries.push('SELECT 1');
    }

    preQueries.resultKeys.push('dbHighlights');

  },

  addPatchQueries: ({
    queriesToRun,
    highlights,
    userId,
    bookId,
    dbHighlights,
    user,
  }) => {

    const now = util.timestampToMySQLDatetime(null, true);
    let containedOldPatch = false;

    if((highlights || []).length > 0) {

      var currentHighlightsUpdatedAtTimestamp = {};
      var currentHighlightsHasNote = {};
      dbHighlights.forEach(function(dbHighlight) {
        currentHighlightsUpdatedAtTimestamp[getHighlightId(dbHighlight)] = util.mySQLDatetimeToTimestamp(dbHighlight.updated_at);
        currentHighlightsHasNote[getHighlightId(dbHighlight)] = !!dbHighlight.hasnote;
      })

      for(let idx in highlights) {
        const highlight = highlights[idx]
        
        if(!util.paramsOk(highlight, ['updated_at','spineIdRef','cfi'], ['color','note','_delete'])) {
          return getErrorObj('invalid parameters');
        }

        if(highlight._delete !== undefined && !highlight._delete) {
          return getErrorObj('invalid parameters (_delete)');
        }

        highlight.updated_at = util.notLaterThanNow(highlight.updated_at);

        if((currentHighlightsUpdatedAtTimestamp[getHighlightId(highlight)] || 0) > highlight.updated_at) {
          containedOldPatch = true;
          continue;
        }

        var updatedAtTimestamp = highlight.updated_at;
        convertTimestampsToMySQLDatetimes(highlight);
        // since I do not know whether to INSERT or UPDATE, just DELETE them all then then INSERT
        if(highlight._delete) {
          if(currentHighlightsHasNote[getHighlightId(highlight)]) {
            queriesToRun.push({
              query: 'UPDATE `highlight` SET deleted_at=? WHERE user_id=? AND book_id=? AND spineIdRef=? && cfi=? AND deleted_at=?',
              vars: [now, userId, bookId, highlight.spineIdRef, highlight.cfi, util.NOT_DELETED_AT_TIME]
            });
          } else {
            queriesToRun.push({
              query: 'DELETE FROM `highlight` WHERE user_id=? AND book_id=? AND spineIdRef=? AND cfi=? AND deleted_at=? AND updated_at<=?',
              vars: [userId, bookId, highlight.spineIdRef, highlight.cfi, util.NOT_DELETED_AT_TIME, highlight.updated_at]
            });
          }
        } else if(currentHighlightsUpdatedAtTimestamp[getHighlightId(highlight)] != null) {
          queriesToRun.push({
            query: 'UPDATE `highlight` SET ? WHERE user_id=? AND book_id=? AND spineIdRef=? AND cfi=? AND deleted_at=?',
            vars: [highlight, userId, bookId, highlight.spineIdRef, highlight.cfi, util.NOT_DELETED_AT_TIME]
          });
        } else {
          highlight.user_id = userId;
          highlight.book_id = bookId;
          queriesToRun.push({
            query: 'INSERT into `highlight` SET ?',
            vars: highlight
          });
          if(user.idpXapiOn && books.length > 0) {
            queriesToRun.push({
              query: 'INSERT into `xapiQueue` SET ?',
              vars: {
                idp_id: user.idpId,
                statement: util.getAnnotateStatement({
                  req: req,
                  bookId: highlight.book_id,
                  bookTitle: books[0].title,
                  bookISBN: books[0].isbn,
                  spineIdRef: highlight.spineIdRef,
                  timestamp: updatedAtTimestamp,
                }),
                unique_tag: Date.now(),  // not worried about dups here
                created_at: now,
              },
            });
          }
        }
      }
    }

    return getSuccessObj(containedOldPatch);

  },

}