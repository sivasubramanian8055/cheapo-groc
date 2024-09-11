resource "aws_dynamodb_table" "flyers_data" {
  name           = "FlyersData"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "flyerId"
  
  attribute {
    name = "flyerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "receipts_data" {
  name           = "ReceiptsData"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "ReceiptID"
  
  attribute {
    name = "ReceiptID"
    type = "S"
  }
}
