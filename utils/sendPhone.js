var axios = require('axios'); //
var sendPhone = async (phoneNumber, message) => {
  phoneNumber = "84" + Number(phoneNumber);
  console.log(phoneNumber)
  let data = `{\n\t\"to\":\" ${phoneNumber}\",\n\t\"content\":\"${message}\",\n\t\"from\":\"SMSINFO\",\n\t\"dlr\":\"yes\",\n\t\"dlr-method\":\"GET\", \n\t\"dlr-level\":\"2\", \n\t\"dlr-url\":\"http://yourcustompostbackurl.com\"\n}`;

  var config = {
    method: 'post',
    url: 'https://rest-api.d7networks.com/secure/send',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic eWZmZjY5MTg6YURPZGpERFk='
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
}
module.exports = sendPhone