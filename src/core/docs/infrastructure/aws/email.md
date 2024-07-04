# Email Infrastructure Docs

At the core of AWS sending is the service Amazon SES (Simple Email Service). Is it by far the best bang for your buck on the internet coming in at 3 to 10x cheaper with no monthly minium costs.

## SES Pricing Comparison

- SES: $0.1 per 1,000 emails with no monthly minimum cost
- Sendgrind: $0.35 per 1,000 emails with minimum of $19 to $1100+ dollars/mo
- MailGun: $1.5 to $1.1 per 1,000 email with minimum of $15 to 100+ dollars/mo
- more coming soon...

# SES Overview

In order to use Amazon SES you need to setup "identities" such as a domain or email address. Once you setup and verify an identity you can send/recieve emails using it.

When you first create your AWS account, your SES service will be in "sandbox" mode.
While you're in sandbox mode, you will not be able to send emails to an address other than the the SES sandbox unless we take some extra steps.

1. The route you WILL eventually take but takes a day or two: You will want to exit "sandbox" mode by request production access for SES. **_(TODO: SES PRODUCTION ACCESS TUTORIAL COMING SOON)_**
2. The quick temporary workaround - manually verifying emails we want to send to: For example, If you to sent emails to a gmail "helloworld@gmail.com" for testing,
   you will need to create a new SES identity for "helloworld@gmail.com". Once you do this, this address will recieve an email from AWS with a URL to verify it.
   Once you click the email, it will be verfied and will now be able to recieve emails.

# The infrastructure deployed by CoreAWSInfraBuider

This infrastructure stack will provide you with two stacks: a production and beta SES stack. The production stack will create an identity for your application
domain e.g. `example.com` while the beta stack will create an email identity for your domain prepended with 'beta' e.g. `beta.example.com` By creating these SES identites,
we can send emails with them using any prefix! For example, you can send emails from 'no-reply@example.com', 'support@example.com' andor anything other prefix you need without
additional setup. The one caveat is you don't have an inbox. If you need an inbox you'll want to set one up with Amazon Workmail which has an extra cost of ~$5 per address so
I recommend you try to avoid it unless you really need an email inbox with your domain.

Additionally, these stacks will deploy a set of DNS records to your domains AWS Route53 Hosted Zone (Route53 is Amazons DNS record server an a Hosted Zone is a compartment for a specific domains records).
These records are necessary to verify your SES domain identity.

# Getting Amazon SES production access

You'll need to provide justification for production access to AWS SES, which allows you to email people withou needing to verify their address as an identity within SES and give significantly higher sending limits.

Here is the message I used to get production access with AWS SES. You can use it as a template for your own business:

```
Unravell is a framework style software template that people can purchase.

Email-Sending Processes and Procedures
1. Frequency of Emails:
We plan to send emails on a regular basis. We are not launched at this time but as we scale we hope to average around 1,000 emails per month. Our email campaigns include transactional emails, such as account registration confirmations, password resets, and subscription notifications, as well as occasional newsletters and updates about our service.

2. Maintaining Recipient Lists:
All email addresses are obtained through explicit user consent during the account registration process on our platform. We ensure that our lists are regularly updated and cleaned to remove invalid or inactive email addresses. We do not purchase email lists.

3. Managing Bounces, Complaints, and Unsubscribe Requests:

 - Bounces: We utilize Amazon SES's to handle bounces. Hard bounces are promptly removed from our mailing list to prevent future sending attempts, and soft bounces are monitored closely. If an email address soft bounces multiple times, it is also removed from our list.

 - Complaints: Any email address associated with a complaint is immediately unsubscribed and removed from our list to ensure compliance and maintain our sender reputation.

 - Unsubscribe Requests: Every email we send includes a clear and easy-to-find unsubscribe link. Unsubscribe requests are processed immediately, and the email addresses are removed from our mailing list without delay.

4. Example of Email Content:
Below is an example of a transactional email that we plan to send:

Subject: Welcome to Unravell!
Hi Sean,

Welcome to Unravell We are excited to have you on board. Click the following link to verify your account <link>

Warm regards,
The Unravell Team
```

# Creating an actual inbox to recieve emails for your custom domain, for example support@yourdomain.com

# If you can manage with one email initially:

## ICloud + Custom domain name emails

I highly recommend iCloud as your custom domain email inbox if you only need one. Is it by far the cheapest at $0.99 a month and Apple is great company. You should first create a new apple account for your business, then you can setup your custom domain. Note that if you'll have to setup some DNS records with whoever your DNS provider is. If you're using Unravell we highly recommend using route53 and adding your records there. It only starts getting complicated when you need to start having more than one inbox.

- Here's a quick youtube video on setting things up: [How to: set up iCloud Mail with a custom email domain](https://www.youtube.com/watch?v=OAUI1SfOH6U&ab_channel=9to5Mac)

### ICloud with multiple custom domain names

- Coming soon, looking into this article ATM: https://discussions.apple.com/thread/253851132?sortBy=best

================================================

## Other helpful resources

### Verifying your Amazon SES email identity without setting up an inbox.

https://aws.amazon.com/blogs/messaging-and-targeting/how-to-verify-an-email-address-in-ses-which-does-not-have-an-inbox/
