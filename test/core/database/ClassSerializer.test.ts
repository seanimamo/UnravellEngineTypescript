import { ClassSerializer } from "@/core/database/serialization";
import { TransformDate } from "@/core/database/serialization/class-transform";
import { Expose } from "class-transformer";

// Note that all members intended to be exposed MUST be annotated with @Expose()
// or else serialization will not work as expected
class TestClass {
  @Expose()
  id: string;

  @TransformDate()
  date: Date;

  constructor(id: string, date: Date) {
    this.id = id;
    this.date = date;
  }
}

describe("ClassSerializer", () => {
  test("serialization maintains json shape even when unexpected extra data is added to json.", async () => {
    const serializer = new ClassSerializer(TestClass);
    const testClass = new TestClass("123", new Date());
    const json = serializer.toJson(testClass);
    json["unexpectedKey"] = "value";
    const fromJson = serializer.fromJson(json);
    expect(fromJson).toEqual(serializer.fromJson(json));
  });
});
