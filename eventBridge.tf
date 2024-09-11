# Define the EventBridge rule
resource "aws_cloudwatch_event_rule" "scrapper_schedule" {
  name                = "scrapper-schedule"
  description         = "Schedule scrapper to run daily at 4:47 AM"
  schedule_expression = "cron(57 15 * * ? *)"
}

# Add the target to the EventBridge rule
resource "aws_cloudwatch_event_target" "scrapper_target" {
  rule      = aws_cloudwatch_event_rule.scrapper_schedule.name
  target_id = "scrapper"
  arn       = aws_lambda_function.scrapper.arn
}

# Add the necessary permissions to allow EventBridge to invoke the Lambda function
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scrapper.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scrapper_schedule.arn
}