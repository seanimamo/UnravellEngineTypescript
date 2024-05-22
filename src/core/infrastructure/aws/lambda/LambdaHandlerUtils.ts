/** This function is necessary inorder to use a method within a class as a function for an AWS Lambda function.
 *
 * If you were to instead directl call an instance method inside a handler you’re likely to get an error.
 * It is a well known side effect of passing functions as value.
 * Because they are being used in isolation through dynamic binding, they lose the calling context.
 * Luckily, this can be easily solved with context binding:
 */
export function createLambdaHandlerFromClassMethod<T>(
    object: T,
    methodName: keyof T
): any {
    if (typeof object[methodName] === "function") {
        return (object[methodName] as Function).bind(object);
    }
    throw new Error("Method not found on the object");
}
