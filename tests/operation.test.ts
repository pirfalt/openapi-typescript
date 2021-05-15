import prettier from "prettier";
import { transformOperationObj } from "../src/transform/operation";
import { transformRequestBodies } from "../src/transform/responses";

describe("requestBody", () => {
  it("basic", () => {
    const schema = {
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Pet" },
          },
          "application/xml": {
            schema: { $ref: "#/components/schemas/Pet" },
          },
        },
      },
    };

    expect(
      transformOperationObj(schema, {
        immutableTypes: false,
        discriminatedUnions: false,
        version: 3,
      }).trim()
    ).toBe(`requestBody: {
    content: {
      "application/json": components["schemas"]["Pet"];
      "application/xml": components["schemas"]["Pet"];
    }
  }`);

    expect(
      transformOperationObj(schema, {
        immutableTypes: true,
        discriminatedUnions: false,
        version: 3,
      }).trim()
    ).toBe(`readonly requestBody: {
    readonly content: {
      readonly "application/json": components["schemas"]["Pet"];
      readonly "application/xml": components["schemas"]["Pet"];
    }
  }`);
  });

  it("ref", () => {
    const schema = {
      requestBody: { $ref: "#/components/requestBodies/Request" },
    };

    expect(
      transformOperationObj(schema, {
        immutableTypes: false,
        discriminatedUnions: false,
        version: 3,
      }).trim()
    ).toBe(`requestBody: components["requestBodies"]["Request"];`);

    expect(
      transformOperationObj(schema, {
        immutableTypes: true,
        discriminatedUnions: false,
        version: 3,
      }).trim()
    ).toBe(`readonly requestBody: components["requestBodies"]["Request"];`);
  });
});

describe("requestBodies", () => {
  const format = (source: string) => prettier.format(source, { parser: "typescript" });

  it("basic", () => {
    const schema = {
      Pet: {
        description: "Pet request body",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                test: { type: "string" },
              },
            },
          },
        },
      },
    };

    const output = transformRequestBodies(schema, {
      immutableTypes: false,
      discriminatedUnions: false,
    }).trim();

    expect(format(`type requestBodies = {${output}}`)).toBe(
      format(`type requestBodies = {
          /** Pet request body */
          Pet: {
            content: {
              "application/json": {
                test?: string;
              };
            };
          };
        };`)
    );

    const outputImmutable = transformRequestBodies(schema, {
      immutableTypes: true,
      discriminatedUnions: false,
    }).trim();

    expect(format(`type requestBodies = {${outputImmutable}}`)).toBe(
      format(`type requestBodies = {
          /** Pet request body */
          Pet: {
            readonly content: {
              readonly "application/json": {
                readonly test?: string;
              };
            };
          };
        };`)
    );
  });

  it("hypenated", () => {
    const schema = {
      "Pet-example": {
        description: "Pet-example request body",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                test: { type: "string" },
              },
            },
          },
        },
      },
    };

    const output = transformRequestBodies(schema, {
      immutableTypes: false,
      discriminatedUnions: false,
    }).trim();

    expect(format(`type requestBodies = {${output}}`)).toBe(
      format(`type requestBodies = {
          /** Pet-example request body */
          "Pet-example": {
            content: {
              "application/json": {
                test?: string;
              };
            };
          };
        };`)
    );

    const outputImmutable = transformRequestBodies(schema, {
      immutableTypes: true,
      discriminatedUnions: false,
    }).trim();

    expect(format(`type requestBodies = {${outputImmutable}}`)).toBe(
      format(`type requestBodies = {
          /** Pet-example request body */
          "Pet-example": {
            readonly content: {
              readonly "application/json": {
                readonly test?: string;
              };
            };
          };
        };`)
    );
  });
});

describe("parameters", () => {
  it("operation parameters only", () => {
    expect(
      transformOperationObj(
        {
          parameters: [
            {
              in: "path",
              name: "p1",
              schema: {
                type: "string",
              },
            },
          ],
        },
        {
          version: 3,
          immutableTypes: false,
          discriminatedUnions: false,
          pathItem: {},
        }
      ).trim()
    ).toBe(`parameters: {
      path: {
    "p1"?: string;
  }

  }`);
  });

  it("inherited path parameters only", () => {
    expect(
      transformOperationObj(
        {},
        {
          version: 3,
          immutableTypes: false,
          discriminatedUnions: false,
          pathItem: {
            parameters: [
              {
                in: "path",
                name: "p1",
                schema: {
                  type: "string",
                },
              },
            ],
          },
        }
      ).trim()
    ).toBe(`parameters: {
      path: {
    "p1"?: string;
  }

  }`);
  });

  it("inherited path parameters and operation parameters", () => {
    expect(
      transformOperationObj(
        {
          parameters: [
            {
              in: "path",
              name: "p1",
              schema: {
                type: "string",
              },
            },
            {
              in: "path",
              name: "p2",
              schema: {
                type: "number",
              },
            },
          ],
        },
        {
          version: 3,
          immutableTypes: false,
          discriminatedUnions: false,
          pathItem: {
            parameters: [
              {
                in: "path",
                name: "p2",
                schema: {
                  type: "string",
                },
              },
              {
                in: "path",
                name: "p3",
                schema: {
                  type: "string",
                },
              },
            ],
          },
        }
      ).trim()
    ).toBe(`parameters: {
      path: {
    "p2"?: number;
    "p3"?: string;
    "p1"?: string;
  }

  }`);
  });
});
