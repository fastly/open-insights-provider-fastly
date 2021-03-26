import { Config } from "../@types";

const configFixture: Config = {
  test: {
    id: "42c91a26-c33f-482a-9ac9-353cd615c0a9",
  },
  session:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMDBmZTliNi05MWM2LTQ0MzQtOGU3Ny0xNDYzMGUyNjNhMjYiLCJleHAiOjE1NTY3MDUxNjIsImlhdCI6MTU1NjcwNTEwM30.Pig3FCY94l2vIfBsIHAPsCzE2mgkGpXcbe0QKHPJcq4",
  hosts: {
    host: "test.fastly-insights.com",
    lookup: "eu.u.test.fastly-insights.com",
  },
  // AKA the "config" object --------------------------
  settings: {
    max_tasks: 20,
    report_errors: false,
    sample_rate: 0.4,
    token: "d00fe9b6-91c6-4434-8e77-14630e263a26",
    library_version: "3.0.0",
  },
  client: {
    country_code: "GB",
    asn: 5089,
    connection_type: "broadband",
    device_type: "unknown",
  },
  server: {
    datacenter: "LCY",
  },
  tasks: [
    {
      id: "MAD",
      req_header: "",
      resource: "https://mad-v4.pops.test.fastly-insights.com/o.svg",
      resp_header: "",
      type: "pop",
      weight: 3.23,
      classification: {},
    },
    {
      id: "LCY",
      req_header: "",
      resource: "https://lcy-v4.pops.test.fastly-insights.com/o.svg",
      resp_header: "",
      type: "pop",
      weight: 1.01,
      classification: {},
    },
    {
      id: "rtt",
      req_header: "",
      resource: "https://www.fastly-insights.com/rtt.json",
      resp_header: "",
      type: "fetch",
      weight: 1,
      classification: {},
    },
  ],
};

export default configFixture;
