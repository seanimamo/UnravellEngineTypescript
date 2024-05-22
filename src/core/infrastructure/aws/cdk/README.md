# AWS CDK Infrastructure

This folder contains infrastructure as code for AWS using AWS CDK (Cloud Development Kit). Using AWS CDK we can write code that will generate cloud templates that we can deploy to AWS.

# Getting started deploying your application

## Prerequisites

-   A domain for your website. [See more information on how to get a domain](../../../docs/infrastructure/aws/domains.md)
-   An AWS Account.
-   If you are on Windows - You must have WSL installed (Windows subsystems for linux)

## Step 1: Deploy your domain related infrastructure

You'll want to deploy your domain related infrastructure first because it will be used by all stages of your application. It is stage agnostic.
