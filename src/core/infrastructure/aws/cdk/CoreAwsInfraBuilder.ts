import { InfraResourceIdBuilder, Stage } from "../..";
import { SesStack, SimpleDnsStack } from "..";
import * as cdk from "aws-cdk-lib";
import { DynamoDBStack, IDatabaseTableData } from "./database";
import { CognitoStack } from "./users";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { PublicServerlessApiStack } from "./api";

export interface SharedGlobalInfraConfig {
    dns: {
        /**
         * The base domain used in all of your apps domains.
         * For example myApp.com
         */
        appBaseDomain: string;
    };
}

export interface CreateDatabaseInfraConfig {
    databaseType: "dynamodb";
    region: string;
    tables: {
        user: {
            tableName: string;
        };
        stripeSubscription?: {
            tableName: string;
        };
    };
}

export interface CreateUserAuthInfraProps {
    cognito: {
        region: string;
        frontEndVerifyCodeURL: string;
        preSignupLambdaTriggerConfig: {
            codePath: string;
            lambdaFunctionName: string;
        };
        postConfirmationLambdaTriggerConfig: {
            codePath: string;
            lambdaFunctionName: string;
        };
    };
}

export interface CreateEmailInfraProps {
    appDomain: string;
}

export interface CreateApiInfraProps {
    publicApi: {
        region: string;
        lambdaApiEndpointConfig: {
            getUserByUserId: {
                codePath: string;
                lambdaFunctionName: string;
            };
        };
    };
}

export class CoreAwsInfraBuilder {
    /**
     * Initializes AWS CDK application
     */
    private readonly cdkApp = new cdk.App();

    public readonly appName: string;
    public readonly awsAccountId: string;

    constructor(appName: string, awsAccountId: string) {
        this.appName = appName;
        this.awsAccountId = awsAccountId;
    }

    buildAppInfra(config: {
        sharedGlobalInfra: SharedGlobalInfraConfig;
        stageRegionInfra: {
            stage: Stage;
            sharedInfra: {
                database: CreateDatabaseInfraConfig;
                userAuth: CreateUserAuthInfraProps;
            };
            uniqueInfra: {
                api: CreateApiInfraProps;
            };
        };
    }) {
        const { sharedGlobalInfra, stageRegionInfra } = config;

        this.composeSharedGlobalInfra(sharedGlobalInfra);

        const sharedStageRegionInfra = this.composeSharedStageRegionInfra(
            stageRegionInfra.stage,
            {
                sharedGlobalInfra: sharedGlobalInfra,
                database: stageRegionInfra.sharedInfra.database,
                userAuth: stageRegionInfra.sharedInfra.userAuth,
            }
        );

        this.composeUniqueStageRegionInfra({
            stage: stageRegionInfra.stage,
            sharedGlobalInfra: sharedGlobalInfra,
            cognitoUserPool:
                sharedStageRegionInfra.userAuthInfra.cognitoUserPool,
            userDatabaseTableData:
                sharedStageRegionInfra.databaseInfra.userTableData,
            api: stageRegionInfra.uniqueInfra.api,
        });
    }

    composeSharedGlobalInfra(config: SharedGlobalInfraConfig) {
        const infraResourceIdBuilder = new InfraResourceIdBuilder(
            this.appName,
            Stage.PROD
        );

        // Creates the root DNS infrastructure for your app, necessary for enabling <yourDomain>.com to work.
        const route53StackName = infraResourceIdBuilder.createStageBasedId(
            "Shared-Route53Stack"
        );
        const baseDomainDnsInfra = new SimpleDnsStack(
            this.cdkApp,
            route53StackName,
            {
                stackName: route53StackName,
                env: {
                    account: this.awsAccountId,
                },
                idBuilder: infraResourceIdBuilder,
                appDomain: config.dns.appBaseDomain,
            }
        );

        return baseDomainDnsInfra;
    }

    composeSharedStageRegionInfra(
        stage: Stage,
        config: {
            sharedGlobalInfra: SharedGlobalInfraConfig;
            database: CreateDatabaseInfraConfig;
            userAuth: CreateUserAuthInfraProps;
        }
    ) {
        const databaseInfra = this.createDatabaseInfra(stage, config.database);

        let emailInfra;
        if (stage === Stage.PROD) {
            emailInfra = this.createEmailInfra(stage, {
                // In production we want emails to come from your base domain e.g. no-reply@myApp.com instead of the one suffixed
                // with stages such as no-reply@prod.myApp.com
                appDomain: config.sharedGlobalInfra.dns.appBaseDomain,
            });
        } else {
            const basicDnsInfra = this.createBasicDnsInfra(
                stage,
                config.sharedGlobalInfra
            );
            // It's important to create unique email identity for non prod stages so we don't ruin our email reputation stats with tests.
            emailInfra = this.createEmailInfra(stage, {
                appDomain: basicDnsInfra.appDomainName,
            });
        }

        const userAuthInfra = this.createUserAuthInfra(
            stage,
            {
                emailStack: emailInfra,
                databaseStack: databaseInfra,
            },
            config.userAuth
        );

        return {
            databaseInfra: databaseInfra,
            emailInfra: emailInfra,
            userAuthInfra: {
                cognitoUserPool: userAuthInfra.cognitoStack.userPool,
            },
        };
    }

    composeUniqueStageRegionInfra(config: {
        stage: Stage;
        sharedGlobalInfra: SharedGlobalInfraConfig;
        cognitoUserPool: IUserPool;
        userDatabaseTableData: IDatabaseTableData;
        api: CreateApiInfraProps;
    }) {
        this.createPublicApiInfra(config.stage, config.api.publicApi.region, {
            sharedGlobalInfra: config.sharedGlobalInfra,
            cognitoUserPool: config.cognitoUserPool,
            userDatabaseTableData: config.userDatabaseTableData,
            apiConfig: config.api,
        });
    }

    /**
     * Creates a hosted zone for your app stage, e.g. beta.myApp.com
     */
    createBasicDnsInfra(
        stage: Stage,
        sharedGlobalInfra: SharedGlobalInfraConfig
    ) {
        const infraResourceIdBuilder = new InfraResourceIdBuilder(
            this.appName,
            stage
        );
        const route53StackName =
            infraResourceIdBuilder.createStageBasedId("Route53Stack");

        const appDomainName = `${stage.toString().toLowerCase()}.${
            sharedGlobalInfra.dns.appBaseDomain
        }`;

        const route53Stack = new SimpleDnsStack(this.cdkApp, route53StackName, {
            stackName: route53StackName,
            env: {
                account: this.awsAccountId,
            },
            terminationProtection: true,
            idBuilder: infraResourceIdBuilder,
            appDomain: appDomainName,
        });

        return {
            dnsStack: route53Stack,
            appDomainName: appDomainName,
        };
    }

    createDatabaseInfra(stage: Stage, props: CreateDatabaseInfraConfig) {
        if (props.databaseType === "dynamodb") {
            const infraResourceIdBuilder = new InfraResourceIdBuilder(
                this.appName,
                stage
            );
            const dynamoDbStackName =
                infraResourceIdBuilder.createStageBasedId("DynamoDBStack");
            const dynamoDbStack = new DynamoDBStack(
                this.cdkApp,
                dynamoDbStackName,
                {
                    stackName: dynamoDbStackName,
                    env: {
                        region: props.region,
                        account: this.awsAccountId,
                    },
                    terminationProtection: true,
                    stage: stage,
                    idBuilder: infraResourceIdBuilder,
                    tableProps: {
                        user: props.tables.user,
                        stripeSubscriptionCache:
                            props.tables.stripeSubscription,
                    },
                }
            );

            return dynamoDbStack;
        } else {
            throw new Error(
                "Only dynamodb is supported as a database at this time."
            );
        }
    }

    createEmailInfra(stage: Stage, props: CreateEmailInfraProps) {
        const infraResourceIdBuilder = new InfraResourceIdBuilder(
            this.appName,
            stage
        );
        const sesStackName =
            infraResourceIdBuilder.createStageBasedId("SesStack");
        const sesStack = new SesStack(this.cdkApp, sesStackName, {
            stackName: sesStackName,
            env: {
                account: this.awsAccountId,
            },
            terminationProtection: true,
            idBuilder: infraResourceIdBuilder,
            appDomain: props.appDomain,
        });

        return sesStack;
    }

    createUserAuthInfra(
        stage: Stage,
        /**
         * Infrastructure stacks User Auth infrastructure is dependant on
         */
        dependantInfra: {
            databaseStack: DynamoDBStack;
            emailStack: SesStack;
        },
        props: CreateUserAuthInfraProps
    ) {
        const infraResourceIdBuilder = new InfraResourceIdBuilder(
            this.appName,
            stage
        );

        const cognitoStackName =
            infraResourceIdBuilder.createStageBasedId("CognitoStack");
        const cognitoStack = new CognitoStack(this.cdkApp, cognitoStackName, {
            stackName: cognitoStackName,
            env: {
                region: props.cognito.region,
                account: this.awsAccountId,
            },
            terminationProtection: true,
            stage: stage,
            idBuilder: infraResourceIdBuilder,
            userDynamoDbTable: dependantInfra.databaseStack.userTableData,
            appDisplayName: this.appName,
            frontEndVerifyCodeURL: props.cognito.frontEndVerifyCodeURL,
            noReplyEmailInfra: dependantInfra.emailStack.noReplyEmailInfra,
            preSignupLambdaTriggerConfig:
                props.cognito.preSignupLambdaTriggerConfig,
            postConfirmationLambdaTriggerConfig:
                props.cognito.postConfirmationLambdaTriggerConfig,
        });

        return {
            cognitoStack: cognitoStack,
        };
    }

    createPublicApiInfra(
        stage: Stage,
        region: string,
        props: {
            sharedGlobalInfra: SharedGlobalInfraConfig;
            cognitoUserPool: IUserPool;
            userDatabaseTableData: IDatabaseTableData;
            apiConfig: CreateApiInfraProps;
        }
    ) {
        const infraResourceIdBuilder = new InfraResourceIdBuilder(
            this.appName,
            stage
        );
        const publicApiStackName =
            infraResourceIdBuilder.createStageBasedId("PublicApi");

        let publicApiDomainName;

        publicApiDomainName = `${stage
            .toString()
            .toLowerCase()}.${region}.api.${
            props.sharedGlobalInfra.dns.appBaseDomain
        }`;

        return new PublicServerlessApiStack(this.cdkApp, publicApiStackName, {
            stackName: publicApiStackName,
            env: {
                account: this.awsAccountId,
            },
            terminationProtection: true,
            appDisplayName: this.appName,
            idBuilder: infraResourceIdBuilder,
            apiDomainName: publicApiDomainName,
            cognitoUserPool: props.cognitoUserPool,
            userDatabaseTableData: props.userDatabaseTableData,
            lambdaApiEndpointConfig:
                props.apiConfig.publicApi.lambdaApiEndpointConfig,
        });
    }
}
