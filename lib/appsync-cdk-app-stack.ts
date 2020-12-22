import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ssm from '@aws-cdk/aws-ssm';
import * as secrets from '@aws-cdk/aws-secretsmanager';

export class AppsyncCdkAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-notes-appsync-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
    });

    // store the API URL in SSM Parameter Store
    new ssm.StringParameter(this, 'GraphQLAPIURL', {
      parameterName: 'GraphQLAPIURL',
      stringValue: api.graphqlUrl
    });

    // store the AppSync API Key to Parameter Store to Secrets Manager
    new secrets.CfnSecret(this, 'GraphQLAPIKey', {
      name: 'GraphQLAPIKey',
      secretString: api.apiKey || ''
    });

    const notesLambda = new lambda.Function(this, 'AppSyncNotesHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'appsync-ds-main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });
    
    // set the new Lambda function as a data source for the AppSync API
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', notesLambda);

    // create resolvers to match GraphQL operations in schema
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getNoteById"
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listNotes"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createNote"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteNote"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateNote"
    });

    // create DynamoDB table
    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(notesLambda)
    
    notesLambda.addEnvironment('NOTES_TABLE', notesTable.tableName);

  }
}
