import {
  Provider as ProviderBase,
  Fetch,
  Executable,
  KnownErrors,
  TestSetupResult,
  TestResultBundle,
  BeaconState,
  BeaconData,
  ResourceTimingEntry,
  getNetworkInformation,
} from "@openinsights/openinsights";

import { Config, ClientInfo, TaskData, Settings } from "./@types";

import chooseRandomTasks from "./lib/chooseRandomTasks";
import filterTasksByClientClassification from "./lib/filterTasksByClientClassification";
import { normalizeEntry } from "./lib/resourceTiming";
import { templateResource } from "./lib/templateResource";
import { getClientInfo } from "./lib/clientInfo";
import prefixKeys from "./util/prefixKeys";

import { DEFAULT_CONFIG_URL, LIBRARY_VERSION } from "./constants";
import retry from "./util/promiseRetry";

interface ResourceCache {
  [key: string]: string;
}

/**
 * An OpenInsights provider for Fastly Insights.
 */
class FastlyProvider extends ProviderBase<Config, TaskData> {
  private _configUrl: string;
  private _libraryVersion: string;
  private _resourceCache: ResourceCache = {};

  /**
   * The main constructor; it recives the settings object the site owner
   * initialised the provider with sets required properties such as the
   * config URL.
   *
   * @param settings Settings to configure the provider
   */
  constructor(settings: Settings) {
    // Call the ProviderBase constructor passing it the name of this provider.
    super("fastly");
    this._configUrl = DEFAULT_CONFIG_URL;
    this._libraryVersion = LIBRARY_VERSION;

    if (settings.config_url && settings.config_url !== "") {
      this._configUrl = settings.config_url;
    }

    if (settings.library_version && settings.library_version !== "") {
      this._libraryVersion = settings.library_version;
    }
  }

  /**
   * A hook called during initialisation, to determine whether the provider
   * should participate in the session. We currently set this to be always true,
   * however may eventually derive the answer from configuraiton settings.
   */
  shouldRun(): boolean {
    return true;
  }

  /**
   * A hook called during initialisation allowing the provider to fetch its
   * session configuration from a remote source. We make a fetch request to
   * the Fastly Insights API and return the JSON - the fetch is retried if it
   * failed.
   */
  fetchSessionConfig(): Promise<Config> {
    const fetchConfig = () => fetch(this._configUrl).then((r) => r.json());
    return retry(fetchConfig);
  }

  /**
   * A hook called during initialisation to map the session configuration object
   * into one or more Executable objects (usually Fetch or other classes
   * inheriting from Test).
   *
   * This contains the main buisness logic for task selection in the provider:
   *   1) Get the client and task data from the session config.
   *   2) Filter all tasks to those which match the current client classification.
   *   3) Randomly select tasks to the max_tasks upperbound.
   *   4) Hydrate the tasks from configuration data to Fetch classes so the
   *      framework can run them.
   */
  expandTasks(): Executable[] {
    const {
      client,
      settings: { max_tasks: maxTasks },
      tasks,
    } = this.sessionConfig;

    const possibleTasks = filterTasksByClientClassification(tasks, client);
    const selectedTasks = chooseRandomTasks(possibleTasks, maxTasks);
    const hydratedTasks = selectedTasks.map(
      (taskData): Fetch<TaskData> =>
        new Fetch<TaskData>(this, { ...this.sessionConfig, ...taskData })
    );

    return hydratedTasks;
  }

  /**
   * A hook called by the Fetch test to map the result data to a
   * TestResultBundle. We use this hook to decorate the test result with client
   * and network information and build the beacon schema.
   *
   * @param timingEntry The Resource Timing entry used to generate the test
   * result.
   * @param response The **Response** object resulting from the fetch
   * activity.
   * @param testConfig The test configuration.
   * @param setupResult The provider-defined result of any test setup
   * activity done prior to the fetch.
   */
  createFetchTestResult(
    timingEntry: ResourceTimingEntry,
    response: Response,
    testConfig: TaskData,
    setupResult: TestSetupResult
  ): Promise<TestResultBundle> {
    const lookup = this.sessionConfig.hosts.lookup;
    const testId = this.sessionConfig.test.id;
    const clientInfoUrl = `https://${testId}.${lookup}/l`;

    // Lookup the client information via the API, this call is internally
    // memoized, therefore we only pay the penalty once for all tests in the
    // session.
    return getClientInfo(clientInfoUrl).then((clientInfo: ClientInfo) => {
      // Get the Fastly datacenter ID which serviced the test object from the
      // test response object headers.
      const id = response.headers.get("X-Datacenter") || "";
      const state = response.ok ? BeaconState.Success : BeaconState.Failure;
      // Lookup the network information if the API exists on this client.
      const networkInformation = getNetworkInformation();
      /* eslint-disable @typescript-eslint/naming-convention */
      const resultData = Object.assign(
        {
          client_connection: networkInformation,
        },
        prefixKeys(
          {
            id,
            attempted_id: testConfig.id,
            ...normalizeEntry(timingEntry), // Normalize the resource timing entry to match our schema.
          },
          "subject_"
        )
      );
      // Build the beacon object by merging the test result and client information.
      const data = Object.assign(
        {
          task_client_data: JSON.stringify(resultData),
        },
        clientInfo
      );
      /* eslint-enable @typescript-eslint/naming-convention */
      const beaconData = {
        state,
        data,
        testConfig,
      };

      const result: TestResultBundle = {
        providerName: this.name,
        beaconData,
        testType: testConfig.type,
        data: [beaconData],
        setupResult,
      };

      return result;
    });
  }

  /**
   * A hook enabling the provider to specify a set of zero or more HTTP request
   * headers to be sent with each test. Currently a no-op.
   */
  getResourceRequestHeaders(): Record<string, string> {
    return {};
  }

  /**
   * A hook enabling the provider to generate a test URL at runtime. We pass the
   * URL through our template engine (to allow insertion of random data, test
   * IDs etc) and cache the result to allow memoization for subsquent calls for
   * the same test.
   *
   * @param testConfig The test configuration object.
   */
  getResourceUrl(testConfig: TaskData): string {
    const { resource } = testConfig;

    if (this._resourceCache[resource]) {
      return this._resourceCache[resource];
    }

    this._resourceCache[resource] = templateResource(
      testConfig.resource,
      this.sessionConfig
    );

    return this._resourceCache[resource];
  }

  /**
   * A hook enabling the provider to handle an error emitted during the session.
   * Currently a no-op but eventually we want to beacon errors if permitted by
   * the session config.
   *
   * @TODO: Implement error beaconing.
   *
   * @param errorType
   * @param innerError
   */
  /* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, no-unused-vars */
  handleError(errorType: KnownErrors, innerError: Error): void {}

  /**
   * A hook to map the TestResultBundle for each test to the beacon payload.
   *
   * @param testConfig The test configuration.
   * @param testData The data resulting from running the test.
   */
  makeBeaconData(testConfig: TaskData, testData: TestResultBundle): BeaconData {
    if (testData.beaconData === undefined) {
      return { state: BeaconState.Failure, testConfig };
    }
    const { test, settings, server } = this.sessionConfig;
    /* eslint-disable @typescript-eslint/naming-convention */
    const beacon = Object.assign(testData.beaconData, {
      data: Object.assign(
        {
          test_id: test.id,
          test_api_key: settings.token,
          test_lib_version: this._libraryVersion,
          test_server: JSON.stringify(server),
          test_timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
          task_type: testConfig.type,
          task_id: testConfig.id,
          task_schema_version: "0.0.0",
          task_server_data: "<% SERVER_DATA %>",
        },
        testData.beaconData.data
      ),
    });
    /* eslint-enable @typescript-eslint/naming-convention */
    return beacon;
  }

  /**
   * A hook enabling the provider to perform encoding of beacon data before
   * sending it, such as `JSON.stringify()`.
   *
   * @param testConfig The test configuration.
   * @param data The data to be encoded.
   */
  encodeBeaconData(_: TaskData, data: BeaconData): string {
    return JSON.stringify(data.data);
  }

  /**
   * A hook called to during beaconing of test data enabling the providers to
   * generate a beacon desintation URL. We use the Fastly Insights becaon
   * endpoint and append the session ID.
   *
   * @param testConfig The test configuration.
   */
  makeBeaconURL(): string {
    const {
      session,
      settings,
      hosts: { host },
    } = this.sessionConfig;
    return `https://${host}/b?k=${settings.token}&s=${session}`;
  }
}

export { FastlyProvider as Provider, Settings };
