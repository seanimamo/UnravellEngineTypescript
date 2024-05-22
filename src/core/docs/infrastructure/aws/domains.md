# Domains

This documentation guide covers how to setup website domains for your application on AWS

## What is a website domain?

A domain is a part of the web address nomenclature someone would use to find your website or a page of your website online.

If you want www.coolSoftware.com to send people to your website, you'll have to obtain the domain and then set of a series of DNS records to get the domain to send people to the machine(s) running your website

## (Optional Learning) DNS and Route53 Explained

- https://www.youtube.com/watch?v=94vdYMBcE5Y&ab_channel=EICITLearning

# Getting Started

## Step 1: Obtaining a domain

Domains need to be purchased from a domain name registrar. You can buy domains from websites like GoDaddy.com or even directly from AWS. If you choose to buy a domain directly from within your AWS account, you will be setup already.

If you choose to buy a domain from a website other than AWS, we'll have to take a few simple extra steps to port it over to AWS.

## Step 2a: Setting up a domain by purchasing one within your AWS account

Coming Soon - Buying a website domain using AWS Route 53

## Step 2b: Setting up a domain that you obtained from outside your AWS account.

The following steps are for people who bought their domain name without using AWS directly.

- ### Step 1: Create a hosted zone in AWS Route53 for your domain.

  First, you'll have to setup a hosted zone in AWS Route53 for the domain. Creating a hosted zone will provide with a set of name servers which are what do the lifting of translating traffic sent to your domain address to the IP addresses of your website machines.

  Your hosted zone will be automatically created by the [provided AWS CDK Route53 stack](../../../infrastructure/aws/cdk/route53-stack.ts).

- ## Step 2: Add your hosted zones domain name servers to your external domain name provider

Now that your hosted zone is created, All your need to do is remove your domains existing domain name serves and copy paste the ones from your AWS Hosted Zone.

- ### Using GoDaddy
  The following [youtube video](https://www.youtube.com/watch?v=zFuluVTsF14&ab_channel=BrainTrustDigital) will show you how to port your domains from GoDaddy, with the exception that you should already have your hosted zone created in AWS Route53 from step 1. The gist of this is you need to assign the name servers from your hosted zone in AWS to your domain on GoDaddy This process is typically as simple as deleting the existing default GoDaddy domain severs and replacing it with the list from your AWS hostedZone.
