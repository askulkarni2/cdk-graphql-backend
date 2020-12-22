#!/usr/bin/env node
import 'source-map-support/register';
import { AppsyncCdkAppStack } from '../lib/appsync-cdk-app-stack';
import { App, Construct, Stage, Stack, StackProps, StageProps, SecretValue, CfnParameter, CfnOutput } from '@aws-cdk/core';
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from '@aws-cdk/pipelines';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';

/**
 * Your AppSync application
 *
 * May consist of one or more Stacks]
 * 
 */
class AppSyncApplication extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        // create the application stack here
        new AppsyncCdkAppStack(this, 'AppsyncCdkAppStack');
    }
}

/**
 * Stack to hold the pipeline
 */
class PipelineStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const sourceArtifact = new codepipeline.Artifact();
        const cloudAssemblyArtifact = new codepipeline.Artifact();
        const githubOrg = new CfnParameter(this, "GitHubOrg", {
            type: "String",
            description: "The name of the GitHub org which the pipeline will use as Source."
        });

        const pipeline = new CdkPipeline(this, 'Pipeline', {
            cloudAssemblyArtifact,

            // This is where the source code is grabbed from, GitHub for example.
            sourceAction: new codepipeline_actions.GitHubSourceAction({
                actionName: 'GitHub',
                output: sourceArtifact,
                oauthToken: SecretValue.secretsManager('GITHUB_TOKEN'),
                owner: githubOrg.valueAsString,
                repo: 'cdk-graphql-backend',
                branch: 'main'
            }),

            // This the where we synthesize the stacks and build our lambdas
            synthAction: SimpleSynthAction.standardNpmSynth({
                sourceArtifact,
                cloudAssemblyArtifact,

                // Use this if you need a build step (if you're not using ts-node
                // or if you have TypeScript Lambdas that need to be compiled).
                buildCommand: 'npm run build',
            })
        });

        // Add a static code analysis stage
        const unitTestAction = new ShellScriptAction({
            actionName: 'UnitTests',
            additionalArtifacts: [sourceArtifact],
            commands: [
                // Install dependencies
                'npm ci',
                // Run the CDK Unit tests
                'npm run test',
                // GraphQL Schema Validation
                'node_modules/.bin/graphql-schema-utilities -s "./graphql/**/*.graphql"'
            ]
        });
        pipeline.addStage('UnitTests').addActions(unitTestAction);

        // Do this as many times as necessary with any account and region
        // Account and region may different from the pipeline's.
        pipeline.addApplicationStage(new AppSyncApplication(this, 'Alpha'));

        // Alpha Testing stage
        const testAction = new ShellScriptAction({
            actionName: 'AlphaIntegTesting',
            additionalArtifacts: [sourceArtifact],
            commands: [
                ''
            ]
        });

        //  PipelineName as output
        new CfnOutput(this, 'PipelineName', {
            description: 'Name of the AppSync Pipeline',
            value: pipeline.codePipeline.pipelineName
        });
    }
}

const app = new App();
new PipelineStack(app, 'PipelineStack');