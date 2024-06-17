## Feature Gates

Features gates allow us to limit a users access to a given feature. It tracks things like maximum usage, current usage and if the user has unlimited access. The design of feature gates `parentId` attribute allows it to be linked to any parent object. For example, a common use case is tying a subscription plan to a set of feature gates to limit how many times a user has allowed to use to a series of features for the given subscription plan.
