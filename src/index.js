let AWS = require("aws-sdk");
let s3 = new AWS.S3({apiVersion: "2006-03-01"});
let rekognition = new AWS.Rekognition();

AWS.config.setPromisesDependency(require('bluebird'));
let lambdaCallback;

exports.handler = function(event, context, callback) {
  console.log("Inside Category handler function");
  console.log("Received event:", JSON.stringify(event, null, 2));
  lambdaCallback = callback
  // Get the object from the event and show its content type
  // let bucket = event.Records[0].s3.bucket.name;
  // let key = event.Records[0].s3.object.key;
  let bucket = "kalefive-alexa-deltoid"
  let key = "cuteDog.jpeg"
  rekognize(bucket, key);
};

function rekognize(bucket, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    },
    MaxLabels: 10,
    MinConfidence: 80
  };

  rekognition.detectLabels(params).promise()
    .then(function(data) {
      console.log("INSIDE resolve function");
      console.log(data);
      return data
    }).then(function(data) {
      console.log("INSIDE next function");
      console.log(data);
      lambdaCallback(null, data)
    }).catch(function(err) {
      console.log("INSIDE reject function");
      console.log(err);
      lambdaCallback(err, null)
    });
};
