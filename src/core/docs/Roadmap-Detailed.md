# Roadmap - Detailed

A detailed roadmap for Unravell features

## Users

- [x] [<span style="color:cyan">Code</span>] Core User object interfaces
- [x] [<span style="color:cyan">Code</span>] Core User Database interfaces
- [x] [<span style="color:cyan">Code</span>] Core User Basic DynamoDB Abstract Database class

- ## User Authentication

  - [x] [<span style="color:cyan">Code</span>] AWS Cognito Pre-Signup webhook lambda trigger basic class
  - [ ] [<span style="color:cyan">Code</span>] Welcome email for new sign ups via exendable email client.
  - [x] [<span style="color:cyan">Code</span>] AWS Cognito Post-Confirmation lambda trigger basic class
  - [x] [<span style="color:PaleGreen">Docs/Tutorial</span>] README mermaid diagrams for different account scenarios (sign up, sign out, sign in)
  - [x] [<span style="color:Magenta">Infra</span>] <span style="color:orange">In Progress</span> AWS Cognito AWS CDK Infrastructure
  - [ ] [<span style="color:Magenta">Infra</span>] <span style="color:orange">In Progress</span> Generify AWS Cognito CDK infa with an abstract class so its reuseable across various apps
  - ## Google Sign in

    **In Progress**: I need to actually deploythe oauth url generation api at this point to test the oauth url consent screen. maybe a prompt type of select_account is useable for both new and returning users. otherwise I'd need to make two seperate links. Also, I need to determine if the scopes I am using are sufficient.

    - [ ] [<span style="color:PaleGreen">Docs/Tutorial</span>] <span style="color:orange">In Progress</span> Google OAuth developer setup tutorial
    - [ ] [<span style="color:cyan">Code</span>] <span style="color:orange">In Progress</span> Google Sign In OAuth Url Generation Basic API
    - [ ] [<span style="color:Magenta">Infra</span>] Google Sign In OAuth Url AWS API Gateway Lambda Proxy Infrastructure
    - [x] [<span style="color:cyan">Code</span>] <span style="color:orange">In Progress</span> Google Sign In OAuth Credentials Object
    - [x] [<span style="color:cyan">Code</span>] Google Sign In OAuth Credentials Database Interfaces
    - [ ] [<span style="color:cyan">Code</span>] Google Sign In OAuth Credentials Basic DynamoDB Abstract Database class

  - ## Facebook Sign in
    - [ ] [<span style="color:PaleGreen">Docs/Tutorial</span>] Facebook/Meta OAuth developer setup tutorial
    - [ ] [<span style="color:cyan">Code</span>] Facebook Sign in code (Develop This Story futher)
  - ## Apple Sign in
    - [ ] [<span style="color:PaleGreen">Docs/Tutorial</span>] Apple OAuth developer setup tutorial
    - [ ] [<span style="color:cyan">Code</span>] Apple Sign in code (Develop This Story futher)
  - ## Microsoft Sign in
    - [ ] [<span style="color:PaleGreen">Docs/Tutorial</span>] Microsoft OAuth developer setup tutorial
    - [ ] [<span style="color:cyan">Code</span>] Microsoft Sign in code (Develop This Story futher)

- ## User APIs
  - [x] [<span style="color:cyan">Code</span>] Get User api endpoint basic implementation
  - [x] [<span style="color:Magenta">Infra</span>] Get User AWS API Gateway Lambda Proxy Infrastructure
  - [x] [<span style="color:cyan">Code</span>] Update User api endpoint basic implementation
  - [ ] [<span style="color:Magenta">Infra</span>] Update User AWS API Gateway Lambda Proxy Infrastructure

## Payments

- [ ] [<span style="color:PaleGreen">Docs/Tutorial</span>] Tutorial for setting up Stripe Account
- [ ] [<span style="color:cyan">Code</span>] Stripe Resource Factory interface

  - ## One Time Payments (EXPERIMENTAL)

    - [ ] [<span style="color:cyan">Code</span>] Core One Time Payment (Invoice) Object interfaces
    - [ ] [<span style="color:cyan">Code</span>] Core One Time Payment (Invoice) Database interfaces
    - [ ] [<span style="color:cyan">Code</span>] Core One Time Payment (Invoice) Basic Dynamodb Class

    - ## Stripe One-Time Payments Cache
      - [ ] [<span style="color:cyan">Code</span>] Stripe One-time Payments Cache Object interfaces
      - [ ] [<span style="color:cyan">Code</span>] Stripe One-time Payments Cache Database interfaces
      - [ ] [<span style="color:cyan">Code</span>] Stripe One-time Payments Cache Basic Dynamodb Class
      - [ ] [<span style="color:cyan">Code</span>] Core Stripe event handler webhook
      - [ ] [<span style="color:Magenta">Infra</span>] Core Stripe event handler Internal API endpoint AWS Lambda
      - [ ] [<span style="color:cyan">Code</span>] Basic implementation of Stripe one-time payment created webhook
      - [ ] [<span style="color:cyan">Code</span>] Basic implementation of Stripe one-time payment updated created webhook
      - [ ] [<span style="color:cyan">Code</span>] Basic implementation of Stripe one-time payment deleted created webhook

  - ## Subscriptions (EXPERIMENTAL)

    - [ ] [<span style="color:cyan">Code</span>] Core Subscription Object interfaces
    - [ ] [<span style="color:cyan">Code</span>] Core Subscription Database interfaces
    - [ ] [<span style="color:cyan">Code</span>] Core Subscription Basic Dynamodb Class

    - ## Stripe Subscriptions Cache

      - [x] [<span style="color:cyan">Code</span>] Stripe Subscription Cache Object interfaces
      - [x] [<span style="color:cyan">Code</span>] Stripe Subscription Cache Database interfaces
      - [x] [<span style="color:cyan">Code</span>] Stripe Subscription Cache Basic Dynamodb Class
      - [ ] [<span style="color:cyan">Code</span>] Core Stripe event handler webhook
      - [ ] [<span style="color:Magenta">Infra</span>] Core Stripe event handler Internal API endpoint AWS Lambda infrastructure
      - [x] [<span style="color:cyan">Code</span>] Basic implementation of Stripe subscription created webhook
      - [x] [<span style="color:cyan">Code</span>] Basic implementation of Stripe subscription updated created webhook
      - [ ] [<span style="color:cyan">Code</span>] Basic implementation of Stripe subscription deleted created webhook
        - ## Stripe Subscriptions Cache API's
        - [x] [<span style="color:cyan">Code</span>] Get Stripe Subscriptions by Customer Id Basic implementation
        - [ ] [<span style="color:Magenta">Infra</span>] Get Stripe Subscriptions by Customer Id AWS API Gateway Infrastructure

## Public API

- [x] [<span style="color:cyan">Code</span>] Interfaces for reusable core logic for individual api endpoints
- [x] [<span style="color:cyan">Code</span>] Interfaces for entry point of for AWS API Gateway Lambda Proxy with Cognito Authorizer
- [ ] [<span style="color:Magenta">Infra</span>] AWS API Gateway infrastructure using CDK & Lambda Proxies with Cognito Authorizer

## Internal API

- [ ] [<span style="color:Magenta">Infra</span>] AWS API Gateway infrastructure using CDK & Lambda Proxies

## Database

- [x] [<span style="color:cyan">Code</span>] Core Database Interfaces
- [x] [<span style="color:cyan">Code</span>] DynamoDB Basic database repository abstract class
- [ ] [<span style="color:cyan">Code</span>] EnableDynamoDB Basic database repository abstract class object compression
- [x] [<span style="color:cyan">Code</span>] DynamoDB interfaces
- [x] [<span style="color:cyan">Code</span>] Allow Dynamodb setup to use a Multi Table setup OR single table
- [x] [<span style="color:Magenta">Infra</span>] AWS DynamoDB infrastructure CDK Stack
- [x] [<span style="color:cyan">Code</span>] Consider refactoring delete operations to use id and not the entire object.
- [x] [<span style="color:green">Code</span>] Refactor repo deletes to use id's rather than the entire object.

## Email

- [ ] <span style="color:orange">In Progress</span> AWS CDK Stack for SES email identities so they can be reused in other stacks.
- [ ] Amazon SES DAO for sending custom email
- [ ] Documentation / Tutorial for setting up Amazon SES
- [ ] MailrLite setup for automated email campagins
- [ ] Custom Domains with AWS Workmail setup

## AWS Infrastructure

- [x] <span style="color:orange">In Progress</span> Refactor of original AWS CDK package for extensible reuse.
- [x] <span style="color:orange">In Progress</span> Create higher level "concepts" for the various stacks, e.g. database, emails, domains, api
- [ ] <span style="color:orange">In Progress</span> Documentation on how to setup AWS CDK for a new account.
- [ ] <span style="color:orange">In Progress</span> Documentation on how to deploy AWS CDK stacks.
- [ ] Documentation on how to checkout deployed API's.
- [ ] <span style="color:orange">In Progress</span> Documentation on how to setup domains on AWS.

## Github jobs

- [ ] Deploy AWS CDK Stack by Stage

## Features

- ## Email Waitlist
  - [ ] Develop this story further
