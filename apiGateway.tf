# api_gateway.tf
resource "aws_api_gateway_rest_api" "grocery_api" {
  name        = "grocery_api"
  description = "API for grocery receipt and flyer search"
}

resource "aws_api_gateway_resource" "search_products_resource" {
  rest_api_id = aws_api_gateway_rest_api.grocery_api.id
  parent_id   = aws_api_gateway_rest_api.grocery_api.root_resource_id
  path_part   = "searchProducts"
}

resource "aws_api_gateway_method" "search_products_method" {
  rest_api_id   = aws_api_gateway_rest_api.grocery_api.id
  resource_id   = aws_api_gateway_resource.search_products_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "search_products_integration" {
  rest_api_id = aws_api_gateway_rest_api.grocery_api.id
  resource_id = aws_api_gateway_resource.search_products_resource.id
  http_method = aws_api_gateway_method.search_products_method.http_method
  type        = "AWS_PROXY"
  integration_http_method = "POST"
  uri         = aws_lambda_function.searchProducts.invoke_arn
}

resource "aws_api_gateway_deployment" "grocery_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.search_products_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.grocery_api.id
  stage_name  = "production"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.searchProducts.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.grocery_api.execution_arn}/*/*"
}

output "api_gateway_url" {
  value = aws_api_gateway_deployment.grocery_api_deployment.invoke_url
}
