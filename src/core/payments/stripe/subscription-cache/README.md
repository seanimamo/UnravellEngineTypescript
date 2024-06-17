## Stripe Subscription cache

The following folder contains logic for maintaining a cache of Stripe subscription data for your app. Stripe provides a pretty low RPS (requests per second) for its API so this enables us to not have to worry about those limits. It's crucial keep our Stripe API bandwidth in check because we don't want customers to be unable to purchase our product.

We can utilize this cache to provide the user with rich information about their current stripe subscription. We can also run analytics on our stripe data without impacting the bandwidth of your stripe account api which is crucial because we don't want customers to be unable to purchase our product.
