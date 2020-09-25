# CDK AppSync GraphQL API

This CDK stack deploys a real-time GraphQL API built with AWS AppSync, Amazon DynamoDB, and AWS Lambda.

## Getting started

To deploy this project, follow these steps.

1. Clone the project

```sh
git clone https://github.com/dabit3/cdk-graphql-backend.git 
```

1. Change into the directory and install dependencies

```sh
cd cdk-graphql-backend

npm install
```

1. Create `GITHUB_TOKEN` as a AWS Secrets Manager secret.

```sh
aws secretsmanager create-secret --name GITHUB_TOKEN \
    --description "Github Token" \
    --secret-string "$GITHUB_TOKEN"
```

1. Run the build

```sh
npm run build
```

1. Bootstrap CDK using the `CDK_NEW_BOOTSTRAP` flag.

```sh
env CDK_NEW_BOOTSTRAP=1  cdk bootstrap \
    --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
    aws://212687814973/us-west-2

cdk deploy
```

1. Deploy the pipeline Stack

```sh
cdk deploy
```
