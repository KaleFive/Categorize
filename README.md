# Categorize
A lambda function to pull S3 image upon upload, running image through AWS Rekognition and then storing this data into DynamoDB

## Using Categorize

Create a lambda function in your AWS account.
Grab the zip version of this code by `cd`-ing into the `src` directory and running
```
zip -r ../../lambda_categorize.zip *
```
Then upload this zip file to your new lambda function.
