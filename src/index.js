let AWS = require("aws-sdk");
let s3 = new AWS.S3({apiVersion: "2006-03-01"});
let rekognition = new AWS.Rekognition();
let docClient = new AWS.DynamoDB.DocumentClient();

let lambdaCallback, bucket, key;

exports.handler = function(event, context, callback) {
  // console.log("Received event:", JSON.stringify(event, null, 2));
  lambdaCallback = callback
  bucket = event.Records[0].s3.bucket.name;
  key = event.Records[0].s3.object.key;
  rekognizeLabels(bucket, key)
    .then(function(data) {
      labelData = data["Labels"];
      return rekognizeFace(bucket, key)
    }).then(function(faceData) {
      faceDetails = faceData["FaceDetails"];
      return addToFacesTable()
    }).then(function(data) {
      console.log("Data added to Face Table");
      lambdaCallback(null, data)
    }).catch(function(err) {
      lambdaCallback(err, null);
    });
};

function addToFacesTable() {
  let labels = []
  labelData.forEach(function(label) {
    labels.push(label.Name)
  });
  let emotions = faceDetails[0]["Emotions"];
  let ageRange = faceDetails[0]["AgeRange"];
  let gender = faceDetails[0]["Gender"];

  let params = {
    TableName: "facesV3",
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
      genderConf: gender.Confidence,
      labels: labels
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
    MaxLabels: 3,
    MinConfidence: 80
  };

  return rekognition.detectLabels(params).promise()
};
