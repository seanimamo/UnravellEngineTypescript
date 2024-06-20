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

============

### Other helpful resources

### Verifying your Amazon SES email identity without setting up an inbox.

https://aws.amazon.com/blogs/messaging-and-targeting/how-to-verify-an-email-address-in-ses-which-does-not-have-an-inbox/
