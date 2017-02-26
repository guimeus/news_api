var logError = function(req, statusCode, apiName) {
    var msg;
    switch (statusCode) {
        case 401:
        msg = "Not Authorized!";
        break;
        case 404:
        msg = "Bad request!"
        break;
        case 503:
        msg = "Frobidden"
        break;
      default:
        msg = "Internal error!"
        break;
    }
    console.log("-------------------------"+apiName+"--------------------");
    console.log("----------------------"+new Date()+"----------------------");
    console.log('statusCode : '+statusCode);
    console.log('response : '+ msg);
    console.log("------------------------------------------------------");
}

exports.logError = logError;
