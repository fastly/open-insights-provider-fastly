# Open Insights Provider Fastly 
An [Open Insights][open-insights] provider for Fastly.

[open-insights]: https://github.com/openinsights/openinsights
[insights-js]: https://github.com/fastly/insights.js

## Quick links
- [FAQ](#faq)
- [Installation](#installation)
- [Running](#running)
- [Development](#development)

## Installation
Open Insights is a framework for building RUM clients. Therefore, you do not install and run the Fastly provider directly within your application, but instead register the provider alongside others in your Open Insights package to build your own customized RUM client.

First install the provider as a package dependency:
```bash
npm install --save @fastly/open-insights-provider-fastly
```

Then import, configure with your API token and any desired [settings](#configuration), and register with Open Insights prior to initializing:
 ```js
import { init, ClientSettingsBuilder } from '@openinsights/openinsights';
import { Provider } from '@fastly/open-insights-provider-fastly';
 
const settingsBuilder = new ClientSettingsBuilder();
const fastlySettings = {
  token: 'c8cff1f2-6917-49e2-80ed-db9dca391bd3'
};

settingsBuilder.addProvider(new Provider(fastlySettings));

// Execute a RUM session
init(settingsBuilder.toSettings())
     .then(result => {
         // `result` contains the results from the RUM session after
         // completion
     });
```

## Configuration
In the majority of cases, the installation described above and the libraries default settings should be fine. However, in some cases you may want more fine-grained control over the providers runtime behavior.

The settings object accepts the following properties:
| Name | Type | Description |
| ---- | ---- | ----------- |
| `max_tasks` | int | The maximum number of tasks the provider will run on any given session  |
| `report_errors` | bool | Whether the provider will beacon its own internal errors |
| `sample_rate` | float | A float between 0 and 1 to control the sample rate for each session |
| `token` | string | Your Fastly provided API token |

## Development

### Requirements
- Node.js >= 6 (```brew install node```)

### Install
```sh
git clone git@github.com:fastly/open-insights-provider-fastly.git
cd open-insights-provider-fastly
npm install
npm run build
```

### Running
Most actions you'd like to perform whilst developing the provider are defined as NPM scripts tasks and can be invoked using `npm run {task}`.

A list of all commands and their description can be found below.


Name                   | Description
-----------------------|-----------------------------
build | Compiles the application for production environments
lint | Lints the source files for TypeScript errors and style errors using ESLint
test | Runs the linting and unit test suite
test:once | Runs the unit test suite once with coverage output
test:watch | Runs the unit test suite in watch mode

## FAQ

### What is it?
The provider is an optional service deployed by some Fastly customers (normally via [Insights.js][insights-js]) for network and performance monitoring and research purposes. It does not collect any personal data. We are only interested in your network, to make the internet work better.

We collect information about HTTP and HTTPS network transactions, including: network routing, performance timing, and equipment characteristics. Measurements are recorded to analyze the performance of the Fastly network and overall state of the internet. 

The provider configuration is served via Fastly’s CDN. All collected data is sent back to the Fastly Insights service and log streamed using Fastly’s [log streaming](https://docs.fastly.com/guides/streaming-logs/) to a Fastly managed data warehouse for subsequent analysis. 

### How does it work?
The provider is deployed to websites via an [Open Insights][open-insights] RUM client.

All tasks are run as low-priority requests and are designed not to interfere with the user's current page navigation or alter the host page’s [Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) in any way, to prevent it from accessing first-party data on the page or affecting page load performance. 

Each task fetches one or more objects from the network and gathers timing information associated with the request (using the [ResourceTiming API](https://w3c.github.io/resource-timing/)) and any other browser information required by the task. See [below](#what-type-of-information-does-fastly-insights-collect) for the full list of task types.

The results of each task are normalized (such as IP anonymization, see [full list of task types](#what-type-of-information-does-fastly-insights-collect) for further information regarding normalization) and the data is then beaconed back to the Fastly Insights service via a POST request to fastly-insights.com/beacon.

The service then adds additional data available from Fastly’s [standard logging variables](https://docs.fastly.com/guides/streaming-logs/useful-variables-to-log) related to the network request and logs all final data to a Fastly managed data warehouse.

### Request flow
![Request flow](https://insights.fastlylabs.com/static/media/request-flow.4b4fe6cf.png)

1. Page load.
1. Fetches configuration from Fastly Insights service.
1. Tasks are executed (see also: [full list of task types](#what-type-of-information-does-fastly-insights-collect) and data collected):
    1. Network requests made to test objects.
    1. Task information recorded on the client.
1. Task information is beaconed back to the Fastly Insights service.
1. Additional information is recorded at the Fastly Insights service before ingestion.
1. Information collected in step 3 and 5 is logged to a Fastly managed data warehouse for post-processing.

### What type of information does Fastly Insights collect?
The following table lists each of the possible tasks Fastly Insights may run on a host web page: 

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Client data*</th>
            <th>Request metadata*</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>POP</td>
            <td>Intended to measure the latency and topology of client connections to Fastly’s point of presence (POP) data centers.</td>
            <td>
                <ul>
                    <li><a href="https://w3c.github.io/resource-timing/#performanceresourcetiming">network timing</a></li>
                    <li>network characteristics</li>
                    <li>browser type (<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent">User-Agent header</a> value is automatically normalized to browser vendor and version)</li>
                    <li>DNS recursive resolver</li>
                    <li>operating system</li>
                <ul>
            </td>
            <td>
                <ul>
                    <li>anonymized Internet Protocol (IP) addresses (client IP addresses are automatically truncated to a /28 network prefix for IPv4 and /58 for IPv6 addresses)</li>
                    <li>country or city-level geographic location</li>
                    <li>date/time stamps</li>
                    <li>network characteristics unique to the client connection</li>
                    <li>browser capabilities: TLS protocol and cipher suites</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>Fetch</td>
            <td>Intended to measure the performance characteristics of a Fastly Insights owned HTTP endpoint. For experimentation and diagnostic purposes.</td>
            <td>
                <ul>
                    <li><a href="https://w3c.github.io/resource-timing/#performanceresourcetiming">network timing</a></li>
                    <li><a href="https://w3c.github.io/server-timing/">server timing</a></li>
                    <li>network characteristics</li>
                    <li>browser type (<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent">User-Agent header</a> value is automatically normalized to browser vendor and version)</li>
                    <li>DNS recursive resolver</li>
                    <li>operating system</li>
                <ul>
            </td>
            <td>
                <ul>
                    <li>anonymized Internet Protocol (IP) addresses (client IP addresses are automatically truncated to a /28 network prefix for IPv4 and /58 for IPv6 addresses)</li>
                    <li>country or city-level geographic location</li>
                    <li>date/time stamps</li>
                    <li>network characteristics unique to the client connection</li>
                    <li>browser capabilities: TLS protocol and cipher suites</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

**_*Note:_**
_**Client data** is collected on the client within a browser and **Request metadata** is collected on the Fastly Insights service._

### What does Fastly use Fastly Insights information for?
Fastly uses the data collected to identify trends and performance heuristics for clients interacting with Fastly and its services. Fastly's use, and potential disclosure, of the data includes:

- Monitoring Fastly’s network and performance
- Improving the accuracy of DNS query answers
- Improving Fastly's capacity and network planning
- A/B testing and comparison of the performance of new technologies to improve Fastly services
- Research initiatives to inform technology decisions
- Research initiatives to inform case studies
- Research initiatives for academic purposes and to feed back to the wider community
- Responding to performance and other related inquiries from Fastly’s customers

### Privacy concerns
As described above in this FAQ, the information collected is statistical data and does not include personally identifiable data. Client IP addresses are truncated, and user-agent strings normalized before ingestion. See the [full list of task types](#what-type-of-information-does-fastly-insights-collect) for a list of data collected.

Fastly Insights does not read or write any data to persistent storage in the browser, which includes cookies. Fastly Insights does not interact with cookies. We do not store any information across browsing sessions.

We may retain the raw information collected from individual Fastly Insights sessions for up to one year. We may retain aggregate information indefinitely.

## License
[MIT](https://github.com/fastly/open-insights-provider-fastly/blob/main/LICENSE)
