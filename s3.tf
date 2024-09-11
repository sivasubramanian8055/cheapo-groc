# s3.tf
resource "aws_s3_bucket" "grocery-receipts-bucket" {
  bucket = "grocery-receipts-bucket"
}

resource "aws_s3_bucket_cors_configuration" "grocery-receipts-bucket_cors" {
  bucket = aws_s3_bucket.grocery-receipts-bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
