import fetchMock from "jest-fetch-mock";
import { mockRandomForEach } from "jest-mock-random";

import { Fetch, TestResultBundle } from "@openinsights/openinsights";
import { Provider } from "./";
import * as template from "./lib/templateResource";

import configFixture from "./fixtures/config";
import clientInfoFixture from "./fixtures/clientInfo";
import entryFixture from "./fixtures/entry";

const settingsFixture = configFixture.settings;
const taskFixture = configFixture.tasks[1];

describe("FastlyProvider", (): void => {
  let providerFixture: Provider;

  beforeEach((): void => {
    providerFixture = new Provider(settingsFixture) as Provider;
    providerFixture.setSessionConfig(configFixture);
    fetchMock.resetMocks();
  });

  describe("shouldRun", (): void => {
    it("should always run", () => {
      const result = new Provider(settingsFixture);
      expect(result.shouldRun()).toBeTruthy();
    });
  });

  describe("fetchSessionConfig", (): void => {
    it("should fetch session config", (): Promise<void> => {
      fetchMock.mockResponseOnce(JSON.stringify(configFixture), {
        headers: {
          "access-control-allow-origin": "*",
        },
      });
      const provider = new Provider(settingsFixture);
      return provider.fetchSessionConfig().then((result) => {
        expect(result).toEqual(configFixture);
      });
    });

    it("should retry the fetch if it fails", (): Promise<void> => {
      fetchMock.mockAbortOnce();
      fetchMock.mockResponseOnce(JSON.stringify(configFixture), {
        headers: {
          "access-control-allow-origin": "*",
        },
      });
      const provider = new Provider(settingsFixture);
      return provider.fetchSessionConfig().then((result) => {
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(result).toEqual(configFixture);
      });
    });
  });

  describe("expandTasks", (): void => {
    mockRandomForEach([0.5]);
    it("should expand session config to tasks", (): void => {
      const result = providerFixture.expandTasks();
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Fetch);
    });
  });

  describe("createFetchTestResult", (): void => {
    let responseFixture: Response;

    beforeEach((): void => {
      responseFixture = new Response("", {
        headers: {
          "X-Datacenter": "LCY",
        },
      });
      fetchMock.resetMocks();
      fetchMock.mockResponseOnce(JSON.stringify(clientInfoFixture), {
        headers: {
          "access-control-allow-origin": "*",
        },
      });
    });

    it("should fetch client info", (): Promise<void> => {
      return providerFixture
        .createFetchTestResult(entryFixture, new Response(), taskFixture, {})
        .then((result) => {
          const data = result.beaconData?.data as any;
          expect(fetchMock.mock.calls).toHaveLength(1);
          expect(fetchMock.mock.calls[0][0]).toEqual(
            "https://42c91a26-c33f-482a-9ac9-353cd615c0a9.eu.u.test.fastly-insights.com/l"
          );
          expect(data).toHaveProperty("client_asn");
        });
    });

    it("should get the subject ID from the X-Datacenter response header", (): Promise<
      void
    > => {
      return providerFixture
        .createFetchTestResult(entryFixture, responseFixture, taskFixture, {})
        .then((result) => {
          const clientData = JSON.parse(
            (result.beaconData?.data as any).task_client_data
          );
          expect(clientData.subject_id).toEqual("LCY");
        });
    });

    it("should normalize the resource timing entry", (): Promise<void> => {
      return providerFixture
        .createFetchTestResult(entryFixture, responseFixture, taskFixture, {})
        .then((result) => {
          const clientData = JSON.parse(
            (result.beaconData?.data as any).task_client_data
          );
          expect(clientData).toHaveProperty("subject_request_start");
          expect(clientData).not.toHaveProperty("subject_name");
        });
    });

    it("should stringify the task client data", (): Promise<void> => {
      return providerFixture
        .createFetchTestResult(entryFixture, responseFixture, taskFixture, {})
        .then((result) => {
          const clientData = (result.beaconData?.data as any).task_client_data;
          expect(clientData).toContain("subject_id");
        });
    });
  });

  describe("getResourceRequestHeaders", (): void => {
    // Currently a no-op
  });

  describe("getResourceUrl", (): void => {
    it("should memoize the result for subsquent calls", () => {
      const templateSpy = jest.spyOn(template, "templateResource");

      // Call 3 times
      providerFixture.getResourceUrl(taskFixture);
      providerFixture.getResourceUrl(taskFixture);
      providerFixture.getResourceUrl(taskFixture);

      expect(templateSpy).toHaveBeenCalledTimes(1);
    });

    it("should template the resource", () => {
      const fixture = Object.assign({}, taskFixture);
      fixture.resource =
        "https://<%TEST_ID%>.fastly-insights.com/o.svg?id=<%TEST_ID%>";
      const result = providerFixture.getResourceUrl(fixture);
      expect(result).toEqual(
        "https://42c91a26-c33f-482a-9ac9-353cd615c0a9.fastly-insights.com/o.svg?id=42c91a26-c33f-482a-9ac9-353cd615c0a9"
      );
    });
  });

  describe("handleError", (): void => {
    // Currently a no-op
  });

  describe("makeBeaconData", (): void => {
    let testDataFixture: TestResultBundle;

    beforeAll(() => {
      const FIXED_SYSTEM_TIME = "2021-01-01T00:00:00Z";
      jest.useFakeTimers("modern");
      jest.setSystemTime(Date.parse(FIXED_SYSTEM_TIME));
      return providerFixture
        .createFetchTestResult(entryFixture, new Response(), taskFixture, {})
        .then((result) => {
          testDataFixture = result;
        });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should add the test_id", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_id).toEqual(configFixture.test.id);
    });

    it("should add the test_id", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_id).toEqual(configFixture.test.id);
    });

    it("should add the test_api_key", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_api_key).toEqual(configFixture.settings.token);
    });

    it("should add the test_lib_version", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_lib_version).toEqual(
        configFixture.settings.library_version
      );
    });

    it("should add the server information as a string", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_server).toContain(`{"datacenter":"LCY"}`);
    });

    it("should add a unix timestamp", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.test_timestamp).toEqual(1609459200);
    });

    it("should add the task type", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.task_type).toEqual("pop");
    });

    it("should add the task ID", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.task_id).toEqual("LCY");
    });

    it("should add task schema version", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.task_schema_version).toEqual("0.0.0");
    });

    it("should add task server data placeholder", () => {
      const result: any = providerFixture.makeBeaconData(
        taskFixture,
        testDataFixture
      ).data;
      expect(result.task_server_data).toEqual("<% SERVER_DATA %>");
    });
  });

  describe("encodeBeaconData", (): void => {
    beforeAll(() => {
      const FIXED_SYSTEM_TIME = "2021-01-01T00:00:00Z";
      jest.useFakeTimers("modern");
      jest.setSystemTime(Date.parse(FIXED_SYSTEM_TIME));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should encode the beacon data as a JSON string", () => {
      return providerFixture
        .createFetchTestResult(entryFixture, new Response(), taskFixture, {})
        .then((testDataFixture) => {
          const beaconDataFixture = providerFixture.makeBeaconData(
            taskFixture,
            testDataFixture
          );
          const result = providerFixture.encodeBeaconData(
            taskFixture,
            beaconDataFixture
          );
          expect(result).toMatchSnapshot();
        });
    });
  });

  describe("makeBeaconURL", (): void => {
    it("should construct the beacon URL", () => {
      const result = providerFixture.makeBeaconURL();
      expect(result).toEqual(
        "https://test.fastly-insights.com/b?k=d00fe9b6-91c6-4434-8e77-14630e263a26&s=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMDBmZTliNi05MWM2LTQ0MzQtOGU3Ny0xNDYzMGUyNjNhMjYiLCJleHAiOjE1NTY3MDUxNjIsImlhdCI6MTU1NjcwNTEwM30.Pig3FCY94l2vIfBsIHAPsCzE2mgkGpXcbe0QKHPJcq4"
      );
    });
  });
});
