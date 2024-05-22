import { ClassConstructor } from "class-transformer";

type enumType = { [s: string]: any };

export class DataValidator {
  data: any;
  dataLabel: string;
  returnIfUndefined: boolean;
  skipProcessing: boolean;

  private before(data: any) {
    if (data === undefined && this.returnIfUndefined) {
      this.skipProcessing = true;
    }
  }

  validate(data: any, dataLabelContext: string) {
    this.data = data;
    this.dataLabel = dataLabelContext;
    this.skipProcessing = false;
    return this;
  }

  private singleArgValidator = (
    validateCallback: (...args: any) => DataValidator,
    args?: any
  ) => {
    this.before(this.data);
    if (!this.skipProcessing) {
      if (args) {
        validateCallback(args);
      } else {
        validateCallback();
      }
    }
    return this;
  };

  private multiArgValidator = (
    validateCallback: (...args: any) => DataValidator,
    args?: any
  ) => {
    this.before(this.data);
    if (!this.skipProcessing) {
      if (args) {
        validateCallback(...args);
      } else {
        validateCallback();
      }
    }
    return this;
  };

  /**
   * prevents the validator function from performing the validation if the data is undefined
   */
  public ifNotUndefined() {
    this.returnIfUndefined = true;
    return this;
  }

  public isString = () =>
    this.singleArgValidator(() => {
      if (typeof this.data !== "string") {
        throw new DataValidationError(`${this.dataLabel} is not a string`);
      }
      return this;
    });

  public isNumber = () =>
    this.singleArgValidator(() => {
      if (typeof this.data !== "number" || isNaN(this.data)) {
        throw new DataValidationError(`${this.dataLabel} is not a number`);
      }
      return this;
    });

  public isBoolean = () =>
    this.singleArgValidator(() => {
      if (typeof this.data !== "boolean") {
        throw new DataValidationError(`${this.dataLabel} is not a boolean`);
      }
      return this;
    });

  public isDate = () =>
    this.singleArgValidator(() => {
      if (!(this.data instanceof Date)) {
        throw new DataValidationError(`${this.dataLabel} is not a Date`);
      }
      return this;
    });

  public isUtcDateString = () =>
    this.singleArgValidator(() => {
      // Attempt to parse the string as a Date object
      const date = new Date(this.data);

      // Check if the date is invalid
      if (isNaN(date.getTime())) {
        throw new DataValidationError(
          `${this.dataLabel} is not a valid UTC string`
        );
      }

      // Check if the dateString is in the expected UTC format
      const utcString = date.toISOString();

      // Compare the dateString and the reconstructed UTC string
      if (this.data === utcString) {
        throw new DataValidationError(
          `${this.dataLabel} is not a valid UTC string`
        );
      }

      return this;
    });

  public isUtcDateNumber = () =>
    this.singleArgValidator(() => {
      // Convert the Unix timestamp to a Date object
      const date = new Date(this.data * 1000);

      // Check if the Date object is valid and represents a UTC date
      if (
        !isNaN(date.getTime()) &&
        date.toISOString().endsWith("Z") === false
      ) {
        throw new DataValidationError(
          `${this.dataLabel} is not a Utc date number`
        );
      }

      return this;
    });

  public isClass = (classType: ClassConstructor<any>) =>
    this.singleArgValidator((classType: ClassConstructor<any>) => {
      if (!(this.data instanceof classType)) {
        throw new DataValidationError(
          `${this.dataLabel} is an invalid class type`
        );
      }
      return this;
    }, classType);

  public notNull = () =>
    this.singleArgValidator(() => {
      if (this.data === null) {
        throw new DataValidationError(`${this.dataLabel} cannot be null`);
      }
      return this;
    });

  public notEmpty = () =>
    this.singleArgValidator(() => {
      if (this.data.length === 0) {
        throw new DataValidationError(`${this.dataLabel} cannot be empty`);
      }
      return this;
    });

  public isUndefined = () =>
    this.singleArgValidator(() => {
      if (this.data != undefined) {
        throw new DataValidationError(`${this.dataLabel} must be undefined`);
      }
      return this;
    });

  public notUndefined = () =>
    this.singleArgValidator(() => {
      if (this.data === undefined) {
        throw new DataValidationError(`${this.dataLabel} cannot be undefined`);
      }
      return this;
    });

  public dateIsNotInFuture = () =>
    this.singleArgValidator(() => {
      const currentDate = new Date();
      if (!(this.data instanceof Date)) {
        throw new DataValidationError(
          `dateIsNotInFuture() can only be called against Date objects`
        );
      }
      if (this.data > currentDate) {
        throw new DataValidationError(
          `${this.dataLabel} cannot be in the future`
        );
      }

      return this;
    });

  public dateIsNotInPast = () =>
    this.singleArgValidator(() => {
      const currentDate = new Date();
      if (!(this.data instanceof Date)) {
        throw new DataValidationError(
          `dateIsNotInPast() can only be called against Date objects`
        );
      }
      if (this.data < currentDate) {
        throw new DataValidationError(
          `${this.dataLabel} cannot be in the past`
        );
      }

      return this;
    });

  public notNegative = () =>
    this.singleArgValidator(() => {
      if (this.data < 0) {
        throw new DataValidationError(`${this.dataLabel} cannot be negative`);
      }
      return this;
    });

  /**
   * Source: https://stackoverflow.com/questions/17380845/how-do-i-convert-a-string-to-enum-in-typescript
   * (See the answer by Artur A)
   */
  isStringInEnum = (enm: { [s: string]: any }) =>
    this.singleArgValidator((enm) => {
      if (!(Object.values(enm) as unknown as string[]).includes(this.data)) {
        throw new DataValidationError(
          `${this.dataLabel} contains a value that is not a member of its respective Enum`
        );
      }
      return this;
    }, enm);

  isStringValidEmail() {
    var validRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (this.data.match(validRegex)) {
      return this;
    } else {
      throw new DataValidationError(
        `${this.dataLabel} is not a propererly formatted email`
      );
    }
  }
}

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataValidationError";
  }
}
