provider "aws" {
  region = "us-east-1"
}

resource "aws_elastic_beanstalk_application" "app" {
  name        = "my-front-end-app"
  description = "Elastic Beanstalk Application for my front-end app"
}

resource "aws_elastic_beanstalk_application_version" "version" {
  application = aws_elastic_beanstalk_application.app.name
  bucket      = "dependencies-siva"
  key         = "client.zip" 
  name        = "v1"
  description = "Version 1 of the application"
}

resource "aws_elastic_beanstalk_environment" "env" {
  name                = "my-front-end-env"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.1.8 running Node.js 20"

  version_label = aws_elastic_beanstalk_application_version.version.name

  # Use your existing instance profile ARN here
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "arn:aws:iam::642429808817:instance-profile/LabInstanceProfile"
  }

  # Use your existing service role ARN here
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = "arn:aws:iam::642429808817:role/LabRole"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = "t3.large"
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "API_GATEWAY_URL"
    value     = aws_api_gateway_deployment.grocery_api_deployment.invoke_url
  }
}

output "elastic_beanstalk_environment_url" {
  value = aws_elastic_beanstalk_environment.env.endpoint_url
}
