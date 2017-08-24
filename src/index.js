let AWS = require("aws-sdk");
let s3 = new AWS.S3({apiVersion: "2006-03-01"});
let rekognition = new AWS.Rekognition();
let docClient = new AWS.DynamoDB.DocumentClient();

let lambdaCallback, bucket, key;

exports.handler = function(event, context, callback) {
  // console.log("Inside Category handler function");
  // console.log("Received event:", JSON.stringify(event, null, 2));
  lambdaCallback = callback
  // Get the object from the event and show its content type
  // let bucket = event.Records[0].s3.bucket.name;
  // let key = event.Records[0].s3.object.key;
  bucket = "kalefive-alexa-deltoid"
  key = "sadHeadshot.jpg"
  rekognizeFace(bucket, key)
    .then(function(faceAttributes) {
      return addToFacesTable(faceAttributes)
    }).then(function(data) {
      console.log("Data added to Face Table");
      lambdaCallback(null, data)
    }).catch(function(err) {
      lambdaCallback(err, null);
    });
};

function addToFacesTable(faceAtt) {
  let emotions = faceAtt["FaceDetails"][0]["Emotions"];
  let ageRange = faceAtt["FaceDetails"][0]["AgeRange"];
  let gender = faceAtt["FaceDetails"][0]["Gender"];

  let params = {
    TableName: "facesV2",
    Item: {
      faceId: 1,
      filename: key.split(".")[0],
      timestamp: new Date().getTime(),
      emotionType1: emotions[0].Type,
      emotionConf1: emotions[0].Confidence,
      emotionType2: emotions[1].Type,
      emotionConf2: emotions[1].Confidence,
      ageLow: ageRange.Low,
      ageHigh: ageRange.High,
      genderValue: gender.Value,
      genderConf: gender.Confidence
    }
  };

  return docClient.put(params).promise()
};

function rekognizeFace(bucket, key) {
  let params = {
    Attributes: ["ALL"],
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  };

  return rekognition.detectFaces(params).promise()
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
