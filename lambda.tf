#layer
resource "aws_lambda_layer_version" "aws-sdk" {
  layer_name          = "aws-sdk"
  compatible_runtimes = ["nodejs20.x"]
  compatible_architectures = ["x86_64", "arm64"]
     lifecycle {
    create_before_destroy = true
  }
  s3_bucket           = "dependencies-siva"
  s3_key              = "aws-sdk.zip"
}

resource "aws_lambda_layer_version" "puppeteer-core" {
  layer_name          = "puppeteer-core"
  compatible_runtimes = ["nodejs20.x"]
  compatible_architectures = ["x86_64", "arm64"]
     lifecycle {
    create_before_destroy = true
  }
  s3_bucket           = "dependencies-siva"
  s3_key              = "puppeteer-core.zip"
}

resource "aws_lambda_layer_version" "sparticuz" {
  layer_name          = "sparticuz"
  compatible_runtimes = ["nodejs20.x"]
  compatible_architectures = ["x86_64", "arm64"]
     lifecycle {
    create_before_destroy = true
  }
  s3_bucket           = "dependencies-siva"
  s3_key              = "sparticuz.zip"
}

#lambda
resource "aws_lambda_function" "processReceipt" {
  function_name = "processReceipt"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = "arn:aws:iam::642429808817:role/LabRole"
  filename      = "./lambda/lambdaSource/process.zip"
  timeout       = 200
  layers = [
    aws_lambda_layer_version.aws-sdk.arn
  ]
}

resource "aws_lambda_function" "scrapper" {
  function_name = "scrapper"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = "arn:aws:iam::642429808817:role/LabRole"
  filename      = "./lambda/lambdaSource/scraper.zip"
  timeout       = 300
  memory_size   = 2048
  layers = [
    aws_lambda_layer_version.aws-sdk.arn,
    aws_lambda_layer_version.puppeteer-core.arn,
    aws_lambda_layer_version.sparticuz.arn,
  ]
}

resource "aws_lambda_function" "searchProducts" {
  function_name = "searchProducts"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = "arn:aws:iam::642429808817:role/LabRole"
  filename      = "./lambda/lambdaSource/search.zip"
  timeout       = 200
  layers = [
    aws_lambda_layer_version.aws-sdk.arn
  ]
}


#trigger

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processReceipt.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.grocery-receipts-bucket.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.grocery-receipts-bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.processReceipt.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "AWSLogs/"
    filter_suffix       = ".log"
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}
