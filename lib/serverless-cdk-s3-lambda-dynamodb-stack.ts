import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as dynamo_db from 'aws-cdk-lib/aws-dynamodb';
import {AttributeType} from 'aws-cdk-lib/aws-dynamodb';

export class ServerlessCdkS3LambdaDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.ManagedPolicy.html
    const iam_role = new iam.Role(this, 'iam-role-logical-id',{
      roleName: 's3lambdadynamodbstack-role',
      description: 'this role is used by assumed by lambda to access s3',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')

    })
    iam_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
    iam_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    iam_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));

    const write_to_ddb_lambda = new lambda.Function(this, 'write_to_ddb_lambda', {
      role: iam_role,
      handler: 'lambda_function.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_9,
      description: 'A simple lambda function which executes on s3 bucket event and write the data to ddb',
      code: lambda.Code.fromAsset('lambda_assets/')
    })
    write_to_ddb_lambda.node.addDependency(iam_role)

    const s3_ddb_data_pvvsln = new s3.Bucket(this, 's3_ddb_data_pvvsln',{
      bucketName: 'ddb-data-pvvsln',
    })

    s3_ddb_data_pvvsln.addEventNotification(s3.EventType.OBJECT_CREATED, new s3_notifications.LambdaDestination(write_to_ddb_lambda))

    const jsondata_ddb = new dynamo_db.Table(this, 'jsondata_ddb',{
      tableName: 'ddb_pvvsln',
      partitionKey: {name:'customername', type:dynamo_db.AttributeType.STRING}
    })

  }
}
