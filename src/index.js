let AWS = require("aws-sdk");
let s3 = new AWS.S3({apiVersion: "2006-03-01"});
let rekognition = new AWS.Rekognition();
let docClient = new AWS.DynamoDB.DocumentClient();

AWS.config.setPromisesDependency(require('bluebird'));
let lambdaCallback;

exports.handler = function(event, context, callback) {
  // console.log("Inside Category handler function");
  // console.log("Received event:", JSON.stringify(event, null, 2));
  lambdaCallback = callback
  // Get the object from the event and show its content type
  // let bucket = event.Records[0].s3.bucket.name;
  // let key = event.Records[0].s3.object.key;
  let bucket = "kalefive-alexa-deltoid"
  let key = "happyCoupleStockImage.jpeg"
  rekognizeFaces(bucket, key)
  console.log("after all promise");
};

function addToFacesTable(faceAtt) {
  console.log("inside Add to FACES table function")
  let params = {
    TableName: "Faces",
    Item: {
      faceId: 1,
      attribute: "hello",
      Random: "test"
    }
  };

  docClient.put(params, function(err, data) {
    if (err) console.log(err);
    else console.log(data)
    lambdaCallback(null, data)
  });
};

function rekognizeFaces(bucket, key) {
  let params = {
    Attributes: ["ALL"],
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  };

  rekognition.detectFaces(params).promise()
    .then(function(data) {
      console.log("INSIDE next function");
      // lambdaCallback(null, data)
      return data
    }).then(function(faceAttributes) {
      console.log(faceAttributes);
      console.log("right before addToFacesTable");
      addToFacesTable(faceAttributes)
      console.log("right after addToFacesTable");
    }).catch(function(err) {
      console.log("INSIDE reject function");
      console.log(err);
      lambdaCallback(err, null)
    });
};

function rekognizeLabels(bucket, key) {
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
      console.log("INSIDE next function");
      console.log(data);
      lambdaCallback(null, data)
    }).catch(function(err) {
      console.log("INSIDE reject function");
      console.log(err);
      lambdaCallback(err, null)
    });
};
