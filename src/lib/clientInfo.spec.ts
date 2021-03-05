import fetchMock from "jest-fetch-mock";
import { ClientInfo } from "../@types";
import { getClientInfo } from "./clientInfo";
import clientInfoFixture from "../fixtures/clientInfo";

describe("clientInfo", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should be able to make an API request and convert some numbers", (): Promise<
    void
  > => {
    fetchMock.mockResponseOnce(JSON.stringify(clientInfoFixture), {
      headers: {
        "access-control-allow-origin": "*",
      },
    });

    const output = getClientInfo("https://api.fastly.com/client-info");
    return output.then((result: ClientInfo): void => {
      expect(result.client_ip).toEqual("1.2.3.4");
      expect(result.client_asn).toEqual(10225);
      expect(result.resolver_asn).toEqual(33);
    });
  });
});
