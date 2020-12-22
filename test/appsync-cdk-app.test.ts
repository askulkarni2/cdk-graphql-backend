import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import * as AppSyncCdkApp from '../lib/appsync-cdk-app-stack';

test('Snapshot test - AppsyncCdkApp', () => {
  const stack = new Stack();
  // WHEN
  new AppSyncCdkApp.AppsyncCdkAppStack(stack, 'MyTestConstruct');
  // THEN
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});