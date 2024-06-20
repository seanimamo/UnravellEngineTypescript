import "dotenv/config"; // This enables to access a local .env file

export const AWS_INFRA_CONFIG = {
  /**
   * The name of your Web application
   */
  appName: "Unravell",

  /**
   * The region the infrastructure will be deployed in
   */
  deploymentRegion: "us-east-2",
  /**
   * Your AWS account id
   */
  awsAccountId: process.env.AWS_ACCOUNT_ID!,
  /**
   * DNS Related configurations
   */
  dns: {
    /**
     * The primary/root domain of your web app.
     */
    primaryAppDomain: "unravell.com",
  },
  /**
   * Database related configurations
   */
  database: {
    tables: {
      user: {
        tableName: "UserTable",
      },
      stripeSubscription: {
        tableName: "StripeSubscriptionTable",
      },
    },
  },
} as const;
